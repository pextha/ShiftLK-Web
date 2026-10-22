import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  async getOverview() {
    // 1. Order stats & Revenue
    const completedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];

    const [orders, expenses, pendingCount, lowStockCount] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: completedStatuses as any } },
        include: { items: true },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { isActive: true, stockQty: { lte: 3 } } }),
    ]);

    let totalRevenue = 0;
    let totalCogs = 0; // Cost of Goods Sold

    for (const order of orders) {
      totalRevenue += Number(order.subtotal); // merchandise revenue
      for (const item of order.items) {
        totalCogs += Number(item.unitCost) * item.qty;
      }
    }

    const totalExpenses = Number(expenses._sum.amount || 0);
    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenue: Math.round(totalRevenue),
      cogs: Math.round(totalCogs),
      grossProfit: Math.round(grossProfit),
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      netMarginPercent: Math.round(netMarginPercent * 10) / 10,
      totalOrders: orders.length,
      pendingOrders: pendingCount,
      lowStockAlerts: lowStockCount,
    };
  }

  async getSalesTimeline(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED'] },
      },
      select: {
        createdAt: true,
        subtotal: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dayMap: Record<string, { date: string; revenue: number; ordersCount: number }> = {};

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { date: key, revenue: 0, ordersCount: 0 };
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (dayMap[key]) {
        dayMap[key].revenue += Number(o.subtotal);
        dayMap[key].ordersCount += 1;
      }
    }

    return Object.values(dayMap);
  }

  async getTopProducts(limit: number = 5) {
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        qty: true,
        unitPrice: true,
      },
      orderBy: {
        _sum: {
          qty: 'desc',
        },
      },
      take: limit,
    });

    const results = await Promise.all(
      orderItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            translations: { where: { language: 'en' } },
            brand: true,
          },
        });

        return {
          productId: item.productId,
          productName: product?.translations[0]?.name || product?.slug || 'Unknown',
          partNumber: product?.partNumber,
          brand: product?.brand?.name,
          unitsSold: item._sum.qty || 0,
          currentStock: product?.stockQty ?? 0,
        };
      })
    );

    return results;
  }

  async getLowStock(threshold: number = 3) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: { lte: threshold },
      },
      orderBy: { stockQty: 'asc' },
      include: {
        translations: { where: { language: 'en' } },
        brand: true,
      },
    });

    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      partNumber: p.partNumber,
      name: p.translations[0]?.name || p.slug,
      brand: p.brand?.name,
      stockQty: p.stockQty,
      sellingPrice: Number(p.sellingPrice),
      costPrice: Number(p.costPrice),
    }));
  }
}

export const analyticsService = new AnalyticsService();
