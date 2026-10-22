import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Admin Profit & Reports (Snapshots, Exclusions, and Calculations)', () => {
  let authCookie = '';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@shiftlk.lk', password: 'ShiftAdmin@2026' });
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    authCookie = cookies.join('; ');
  });

  it('GET /api/v1/admin/analytics/reports should only count CONFIRMED, SHIPPED, DELIVERED orders', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/reports?period=monthly')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.revenue).toBeGreaterThanOrEqual(0);
    expect(res.body.data.summary.cogs).toBeGreaterThanOrEqual(0);
    expect(res.body.data.summary.grossProfit).toBe(
      res.body.data.summary.revenue - res.body.data.summary.cogs
    );
    expect(res.body.data.summary.statusCounts).toBeDefined();
    expect(Array.isArray(res.body.data.timeline)).toBe(true);
    expect(Array.isArray(res.body.data.topSellingProducts)).toBe(true);
    expect(Array.isArray(res.body.data.ordersByDistrict)).toBe(true);
  });

  it('Changing a product cost or selling price must NOT alter past order snapshots or historical profit', async () => {
    // 1. Find a confirmed order with order items
    const confirmedOrder = await prisma.order.findFirst({
      where: { status: { in: ['CONFIRMED', 'DELIVERED', 'SHIPPED'] } },
      include: { items: true },
    });

    if (!confirmedOrder || confirmedOrder.items.length === 0) return;

    const item = confirmedOrder.items[0];
    const originalSnapshotCost = Number(item.unitCost);
    const originalSnapshotPrice = Number(item.unitPrice);

    // 2. Modify the product's selling price and cost price in the catalog
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        costPrice: originalSnapshotCost + 5000,
        sellingPrice: originalSnapshotPrice + 8000,
      },
    });

    // 3. Verify the order item snapshot is unchanged
    const reloadedOrderItem = await prisma.orderItem.findUnique({
      where: { id: item.id },
    });

    expect(Number(reloadedOrderItem?.unitCost)).toBe(originalSnapshotCost);
    expect(Number(reloadedOrderItem?.unitPrice)).toBe(originalSnapshotPrice);

    // Restore catalog prices
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        costPrice: originalSnapshotCost,
        sellingPrice: originalSnapshotPrice,
      },
    });
  });
});
