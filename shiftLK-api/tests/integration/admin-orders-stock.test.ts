import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Admin Orders & Atomic Stock Management', () => {
  let authCookie = '';
  let testProduct: any;
  let testOrderId = '';

  beforeAll(async () => {
    // 1. Admin login to obtain cookie
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@shiftlk.lk', password: 'ShiftAdmin@2026' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    authCookie = cookies.join('; ');

    // 2. Find or create an active product with stock >= 10
    testProduct = await prisma.product.findFirst({
      where: { isActive: true, stockQty: { gte: 10 } },
    });

    if (!testProduct) {
      const brand = await prisma.brand.findFirst();
      const cat = await prisma.category.findFirst();
      testProduct = await prisma.product.create({
        data: {
          slug: 'test-admin-stock-part',
          partNumber: 'TEST-STK-01',
          brandId: brand!.id,
          categoryId: cat!.id,
          sellingPrice: 2000,
          costPrice: 1200,
          stockQty: 20,
          isActive: true,
          translations: {
            create: { language: 'en', name: 'Test Stock Part', description: 'Test' },
          },
        },
      });
    }

    // 3. Place a public order for 2 items
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        customerName: 'Stock Test Customer',
        phone: '077 987 6543',
        address: 'No 10, Test Lane, Colombo 03',
        district: 'Colombo',
        items: [{ productId: testProduct.id, qty: 2 }],
        locale: 'en',
      });

    expect(orderRes.status).toBe(201);
    const orderCode = orderRes.body.data.orderCode;

    const dbOrder = await prisma.order.findUnique({
      where: { orderCode },
    });
    testOrderId = dbOrder!.id;
  });

  it('initial product stock should NOT be decremented while order is in PENDING state', async () => {
    const currentProd = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(currentProd?.stockQty).toBe(testProduct.stockQty);
  });

  it('GET /api/v1/admin/orders should list orders including cost prices', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const found = res.body.data.find((o: any) => o.id === testOrderId);
    expect(found).toBeDefined();
    expect(found.items[0]).toHaveProperty('unitCost');
  });

  it('PATCH /api/v1/admin/orders/:id/status to CONFIRMED must atomically lock and decrement product stock', async () => {
    const initialQty = (await prisma.product.findUnique({ where: { id: testProduct.id } }))!.stockQty;

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${testOrderId}/status`)
      .set('Cookie', authCookie)
      .send({
        status: 'CONFIRMED',
        notes: 'Customer verified advance payment receipt',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');

    // Verify product stock in DB was decremented by 2
    const afterConfirmProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(afterConfirmProd!.stockQty).toBe(initialQty - 2);

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: { entityType: 'Order', entityId: testOrderId, action: 'ORDER_STATUS_CHANGED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
  });

  it('PATCH /api/v1/admin/orders/:id/status to CANCELLED must restore allocated product stock', async () => {
    const initialQty = (await prisma.product.findUnique({ where: { id: testProduct.id } }))!.stockQty;

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${testOrderId}/status`)
      .set('Cookie', authCookie)
      .send({
        status: 'CANCELLED',
        notes: 'Customer requested cancellation before courier dispatch',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');

    // Verify product stock was restored (+2)
    const afterCancelProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(afterCancelProd!.stockQty).toBe(initialQty + 2);
  });
});
