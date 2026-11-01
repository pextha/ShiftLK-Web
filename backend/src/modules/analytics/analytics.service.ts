import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  private async shouldHideProfitForUser(userRole?: string): Promise<boolean> {
    if (userRole !== 'STAFF') return false;
    const setting = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });
    return Boolean(setting?.hideProfitFromStaff);
  }

  async getOverview(userRole?: string) {
    // 1. Order stats & Revenue
    const completedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];

    const [orders, expenses, pendingCount, activeProducts, hideProfit] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: completedStatuses as any } },
        include: { items: true },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { stockQty: true, lowStockThreshold: true },
      }),
      this.shouldHideProfitForUser(userRole),
    ]);

    const lowStockCount = activeProducts.filter(
      (p) => p.stockQty <= (p.lowStockThreshold ?? 5)
    ).length;

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
      cogs: hideProfit ? 0 : Math.round(totalCogs),
      grossProfit: hideProfit ? 0 : Math.round(grossProfit),
      grossMarginPercent: hideProfit ? 0 : Math.round(grossMarginPercent * 10) / 10,
      totalExpenses: hideProfit ? 0 : Math.round(totalExpenses),
      netProfit: hideProfit ? 0 : Math.round(netProfit),
      netMarginPercent: hideProfit ? 0 : Math.round(netMarginPercent * 10) / 10,
      totalOrders: orders.length,
      pendingOrders: pendingCount,
      lowStockAlerts: lowStockCount,
      hideProfit,
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

  async getLowStock(threshold?: number, userRole?: string) {
    const [products, hideProfit] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
        },
        orderBy: { stockQty: 'asc' },
        include: {
          translations: { where: { language: 'en' } },
          brand: true,
        },
      }),
      this.shouldHideProfitForUser(userRole),
    ]);

    const lowStockItems = products.filter((p) => {
      const limit = threshold !== undefined ? threshold : p.lowStockThreshold ?? 5;
      return p.stockQty <= limit;
    });

    return lowStockItems.map((p) => ({
      id: p.id,
      slug: p.slug,
      partNumber: p.partNumber,
      name: p.translations[0]?.name || p.slug,
      brand: p.brand?.name,
      stockQty: p.stockQty,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      sellingPrice: Number(p.sellingPrice),
      costPrice: hideProfit ? 0 : Number(p.costPrice),
    }));
  }

  async getReports(
    options: {
      period?: 'daily' | 'weekly' | 'monthly' | 'custom';
      startDate?: string;
      endDate?: string;
    },
    userRole?: string
  ) {
    const hideProfit = await this.shouldHideProfitForUser(userRole);
    const period = options.period || 'monthly';
    const now = new Date();

    let fromDate: Date;
    let toDate: Date = new Date();

    if (period === 'daily') {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 7);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 30);
      fromDate.setHours(0, 0, 0, 0);
    } else if (options.startDate && options.endDate) {
      fromDate = new Date(options.startDate);
      toDate = new Date(options.endDate);
      toDate.setHours(23, 59, 59, 999);
    } else {
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 30);
    }

    const allOrdersInRange = await prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                partNumber: true,
                translations: { where: { language: 'en' }, select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const o of allOrdersInRange) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }

    const validOrders = allOrdersInRange.filter((o) =>
      ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status)
    );

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: { date: 'asc' },
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalDeliveryFees = 0;
    let totalItemsSold = 0;

    const productSalesMap: Record<
      string,
      {
        id: string;
        name: string;
        partNumber: string;
        unitsSold: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    > = {};

    const districtMap: Record<string, { district: string; orderCount: number; totalSpent: number }> = {};
    const dailyMap: Record<
      string,
      {
        date: string;
        ordersCount: number;
        revenue: number;
        cogs: number;
        grossProfit: number;
        expenses: number;
        netProfit: number;
      }
    > = {};

    for (const o of validOrders) {
      totalDeliveryFees += Number(o.deliveryCost);
      const dayKey = o.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });

      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          date: dayKey,
          ordersCount: 0,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      dailyMap[dayKey].ordersCount++;

      if (!districtMap[o.district]) {
        districtMap[o.district] = { district: o.district, orderCount: 0, totalSpent: 0 };
      }
      districtMap[o.district].orderCount++;
      districtMap[o.district].totalSpent += Number(o.subtotal);

      for (const item of o.items) {
        const itemRevenue = Number(item.unitPrice) * item.qty;
        const itemCost = Number(item.unitCost) * item.qty;
        const itemProfit = itemRevenue - itemCost;

        totalRevenue += itemRevenue;
        totalCogs += itemCost;
        totalItemsSold += item.qty;

        dailyMap[dayKey].revenue += itemRevenue;
        dailyMap[dayKey].cogs += itemCost;
        dailyMap[dayKey].grossProfit += itemProfit;

        const pId = item.productId;
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            id: pId,
            name: item.product?.translations[0]?.name || item.product?.slug || 'Unknown',
            partNumber: item.product?.partNumber || '',
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }
        productSalesMap[pId].unitsSold += item.qty;
        productSalesMap[pId].revenue += itemRevenue;
        productSalesMap[pId].cost += hideProfit ? 0 : itemCost;
        productSalesMap[pId].profit += hideProfit ? 0 : itemProfit;
      }
    }

    let totalExpensesAmount = 0;
    for (const exp of expenses) {
      const expAmount = Number(exp.amount);
      totalExpensesAmount += expAmount;
      const dayKey = exp.date.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          date: dayKey,
          ordersCount: 0,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      dailyMap[dayKey].expenses += expAmount;
    }

    for (const d of Object.values(dailyMap)) {
      d.netProfit = d.grossProfit - d.expenses;
      d.revenue = Math.round(d.revenue);
      d.cogs = hideProfit ? 0 : Math.round(d.cogs);
      d.grossProfit = hideProfit ? 0 : Math.round(d.grossProfit);
      d.expenses = hideProfit ? 0 : Math.round(d.expenses);
      d.netProfit = hideProfit ? 0 : Math.round(d.netProfit);
    }

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpensesAmount;

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);

    const mostProfitableProducts = Object.values(productSalesMap)
      .sort((a, b) => (hideProfit ? b.unitsSold - a.unitsSold : b.profit - a.profit))
      .slice(0, 10);

    const ordersByDistrict = Object.values(districtMap).sort((a, b) => b.orderCount - a.orderCount);

    return {
      period,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      hideProfit,
      summary: {
        totalOrders: validOrders.length,
        statusCounts,
        totalItemsSold,
        revenue: Math.round(totalRevenue),
        cogs: hideProfit ? 0 : Math.round(totalCogs),
        grossProfit: hideProfit ? 0 : Math.round(grossProfit),
        grossMarginPercent:
          hideProfit || totalRevenue <= 0
            ? 0
            : Math.round(((grossProfit / totalRevenue) * 100) * 10) / 10,
        deliveryFeesCollected: Math.round(totalDeliveryFees),
        totalExpenses: hideProfit ? 0 : Math.round(totalExpensesAmount),
        netProfit: hideProfit ? 0 : Math.round(netProfit),
        netMarginPercent:
          hideProfit || totalRevenue <= 0
            ? 0
            : Math.round(((netProfit / totalRevenue) * 100) * 10) / 10,
      },
      timeline: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
      topSellingProducts,
      mostProfitableProducts,
      ordersByDistrict,
    };
  }
}

export const analyticsService = new AnalyticsService();
