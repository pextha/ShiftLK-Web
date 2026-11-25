import { prisma } from '../../lib/prisma';

export interface ProfitAllocationBreakdown {
  distributableProfit: number;
  deficit: number;
  reinvest50: number;
  salaryTotal30: number;
  pathumSalary15: number;
  sachinSalary15: number;
  reserve10: number;
  taxBills10: number;
}

function calculateProfitAllocation(
  netProfit: number,
  hideProfit: boolean = false
): ProfitAllocationBreakdown {
  if (hideProfit || netProfit <= 0) {
    return {
      distributableProfit: 0,
      deficit: hideProfit ? 0 : netProfit < 0 ? Math.round(Math.abs(netProfit)) : 0,
      reinvest50: 0,
      salaryTotal30: 0,
      pathumSalary15: 0,
      sachinSalary15: 0,
      reserve10: 0,
      taxBills10: 0,
    };
  }

  const distributable = Math.round(netProfit);
  const reinvest50 = Math.round(distributable * 0.5);
  const pathumSalary15 = Math.round(distributable * 0.15);
  const sachinSalary15 = Math.round(distributable * 0.15);
  const salaryTotal30 = pathumSalary15 + sachinSalary15;
  const reserve10 = Math.round(distributable * 0.1);
  const taxBills10 = Math.round(distributable * 0.1);

  return {
    distributableProfit: distributable,
    deficit: 0,
    reinvest50,
    salaryTotal30,
    pathumSalary15,
    sachinSalary15,
    reserve10,
    taxBills10,
  };
}

function getStartOfWeekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0 = Sun, 1 = Mon ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d.toISOString().split('T')[0];
}

export class AnalyticsService {
  private async shouldHideProfitForUser(userRole?: string): Promise<boolean> {
    if (userRole !== 'STAFF') return false;
    const setting = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });
    return Boolean(setting?.hideProfitFromStaff);
  }

  async getOverview(userRole?: string, period: 'daily' | 'weekly' | 'monthly' | 'all' = 'all') {
    const completedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const now = new Date();
    let fromDate: Date | undefined;

    if (period === 'daily') {
      fromDate = new Date(now);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 6);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const orderWhere: any = {
      status: { in: completedStatuses as any },
      ...(fromDate ? { createdAt: { gte: fromDate } } : {}),
    };

    const expenseWhere: any = {
      ...(fromDate ? { date: { gte: fromDate } } : {}),
    };

    const [orders, expenses, pendingCount, activeProducts, hideProfit] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        include: { items: true },
      }),
      prisma.expense.aggregate({
        where: expenseWhere,
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
    let totalCogs = 0;

    for (const order of orders) {
      totalRevenue += Number(order.subtotal);
      for (const item of order.items) {
        totalCogs += Number(item.unitCost) * item.qty;
      }
    }

    const totalExpenses = Number(expenses._sum.amount || 0);
    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const allocation = calculateProfitAllocation(netProfit, hideProfit);

    return {
      period,
      revenue: Math.round(totalRevenue),
      cogs: hideProfit ? 0 : Math.round(totalCogs),
      grossProfit: hideProfit ? 0 : Math.round(grossProfit),
      grossMarginPercent: hideProfit ? 0 : Math.round(grossMarginPercent * 10) / 10,
      totalExpenses: hideProfit ? 0 : Math.round(totalExpenses),
      netProfit: hideProfit ? 0 : Math.round(netProfit),
      netMarginPercent: hideProfit ? 0 : Math.round(netMarginPercent * 10) / 10,
      allocation,
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
      period?: 'daily' | 'weekly' | 'monthly' | 'this_month' | 'custom' | 'all';
      month?: string; // e.g. '2026-11'
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

    if (options.month && /^\d{4}-\d{2}$/.test(options.month)) {
      const [yearStr, monthStr] = options.month.split('-');
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      fromDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
      toDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    } else if (period === 'daily') {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 6);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'this_month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'monthly') {
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 29);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'all') {
      fromDate = new Date(2024, 0, 1, 0, 0, 0, 0);
    } else if (options.startDate && options.endDate) {
      fromDate = new Date(options.startDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(options.endDate);
      toDate.setHours(23, 59, 59, 999);
    } else {
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 29);
      fromDate.setHours(0, 0, 0, 0);
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

    interface BucketRow {
      date: string;
      label: string;
      ordersCount: number;
      itemsSold: number;
      revenue: number;
      cogs: number;
      grossProfit: number;
      expenses: number;
      netProfit: number;
      allocation?: ProfitAllocationBreakdown;
    }

    const dailyMap: Record<string, BucketRow> = {};
    const weeklyMap: Record<string, BucketRow> = {};
    const monthlyMap: Record<string, BucketRow> = {};

    const ensureBucket = (map: Record<string, BucketRow>, key: string, label: string) => {
      if (!map[key]) {
        map[key] = {
          date: key,
          label,
          ordersCount: 0,
          itemsSold: 0,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      return map[key];
    };

    for (const o of validOrders) {
      totalDeliveryFees += Number(o.deliveryCost);
      const dayKey = o.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
      const weekKey = getStartOfWeekKey(dayKey);
      const monthKey = dayKey.slice(0, 7); // YYYY-MM

      const dayBucket = ensureBucket(dailyMap, dayKey, dayKey);
      const weekBucket = ensureBucket(weeklyMap, weekKey, `Week of ${weekKey}`);
      const monthBucket = ensureBucket(monthlyMap, monthKey, monthKey);

      dayBucket.ordersCount++;
      weekBucket.ordersCount++;
      monthBucket.ordersCount++;

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

        for (const bucket of [dayBucket, weekBucket, monthBucket]) {
          bucket.itemsSold += item.qty;
          bucket.revenue += itemRevenue;
          bucket.cogs += itemCost;
          bucket.grossProfit += itemProfit;
        }

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
    const expenseCategoryMap: Record<string, { category: string; amount: number; count: number }> = {};

    for (const exp of expenses) {
      const expAmount = Number(exp.amount);
      totalExpensesAmount += expAmount;

      const catKey = exp.type || 'OTHER';
      if (!expenseCategoryMap[catKey]) {
        expenseCategoryMap[catKey] = { category: catKey, amount: 0, count: 0 };
      }
      expenseCategoryMap[catKey].amount += expAmount;
      expenseCategoryMap[catKey].count += 1;

      const dayKey = exp.date.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
      const weekKey = getStartOfWeekKey(dayKey);
      const monthKey = dayKey.slice(0, 7);

      const dayBucket = ensureBucket(dailyMap, dayKey, dayKey);
      const weekBucket = ensureBucket(weeklyMap, weekKey, `Week of ${weekKey}`);
      const monthBucket = ensureBucket(monthlyMap, monthKey, monthKey);

      dayBucket.expenses += expAmount;
      weekBucket.expenses += expAmount;
      monthBucket.expenses += expAmount;
    }

    const finalizeBuckets = (map: Record<string, BucketRow>) => {
      return Object.values(map)
        .map((d) => {
          const rawNet = d.grossProfit - d.expenses;
          return {
            ...d,
            revenue: Math.round(d.revenue),
            cogs: hideProfit ? 0 : Math.round(d.cogs),
            grossProfit: hideProfit ? 0 : Math.round(d.grossProfit),
            expenses: hideProfit ? 0 : Math.round(d.expenses),
            netProfit: hideProfit ? 0 : Math.round(rawNet),
            allocation: calculateProfitAllocation(rawNet, hideProfit),
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const dailyTimeline = finalizeBuckets(dailyMap);
    const weeklyTimeline = finalizeBuckets(weeklyMap);
    const monthlyTimeline = finalizeBuckets(monthlyMap);

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpensesAmount;
    const allocation = calculateProfitAllocation(netProfit, hideProfit);

    const expensesByCategory = hideProfit
      ? []
      : Object.values(expenseCategoryMap)
          .map((e) => ({
            category: e.category,
            amount: Math.round(e.amount),
            count: e.count,
            percent:
              totalExpensesAmount > 0
                ? Math.round(((e.amount / totalExpensesAmount) * 100) * 10) / 10
                : 0,
          }))
          .sort((a, b) => b.amount - a.amount);

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
        allocation,
      },
      expensesByCategory,
      timeline: dailyTimeline,
      dailyTimeline,
      weeklyTimeline,
      monthlyTimeline,
      topSellingProducts,
      mostProfitableProducts,
      ordersByDistrict,
    };
  }
}

export const analyticsService = new AnalyticsService();
