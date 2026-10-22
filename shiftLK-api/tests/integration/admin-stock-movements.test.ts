import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Admin Stock Management & Stock Movements', () => {
  let authCookie = '';
  let testProductId = '';

  beforeAll(async () => {
    // Login as admin
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@shiftlk.lk', password: 'ShiftAdmin@2026' });
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    authCookie = cookies.join('; ');

    const brand = await prisma.brand.findFirst();
    const category = await prisma.category.findFirst();
    const prod = await prisma.product.create({
      data: {
        slug: `stock-test-prod-${Date.now()}`,
        partNumber: `STK-${Date.now()}`,
        brandId: brand!.id,
        categoryId: category!.id,
        sellingPrice: 1500,
        costPrice: 1000,
        stockQty: 20,
        lowStockThreshold: 5,
        isActive: true,
      },
    });
    testProductId = prod.id;
  });

  it('GET /api/v1/admin/products/stock/overview should return summary metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/products/stock/overview')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProducts).toBeGreaterThan(0);
    expect(typeof res.body.data.totalUnits).toBe('number');
    expect(typeof res.body.data.totalStockValueAtCost).toBe('number');
    expect(typeof res.body.data.expectedProfitIfAllSold).toBe('number');
  });

  it('POST /api/v1/admin/products/:id/restock should increment stock and record a StockMovement', async () => {
    const beforeProd = await prisma.product.findUnique({ where: { id: testProductId } });
    const initialStock = beforeProd?.stockQty ?? 0;

    const res = await request(app)
      .post(`/api/v1/admin/products/${testProductId}/restock`)
      .set('Cookie', authCookie)
      .send({
        quantity: 10,
        note: 'Vitest test restock batch',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.currentStock).toBe(initialStock + 10);

    // Verify StockMovement entry was created
    const movement = await prisma.stockMovement.findFirst({
      where: {
        productId: testProductId,
        reason: 'RESTOCK',
        note: 'Vitest test restock batch',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(movement).toBeDefined();
    expect(movement?.changeQty).toBe(10);
  });

  it('PATCH /api/v1/admin/products/:id/stock should adjust stock inline and record a StockMovement', async () => {
    const beforeProd = await prisma.product.findUnique({ where: { id: testProductId } });
    const currentStock = beforeProd?.stockQty ?? 0;

    const res = await request(app)
      .patch(`/api/v1/admin/products/${testProductId}/stock`)
      .set('Cookie', authCookie)
      .send({
        newQty: currentStock + 5,
        note: 'Inline adjustment test',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stockQty).toBe(currentStock + 5);

    const movement = await prisma.stockMovement.findFirst({
      where: {
        productId: testProductId,
        reason: 'MANUAL_ADJUSTMENT',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(movement).toBeDefined();
    expect(movement?.changeQty).toBe(5);
  });

  it('GET /api/v1/admin/products/stock/movements should list recorded stock movements', async () => {
    const res = await request(app)
      .get('/api/v1/admin/products/stock/movements')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
  });
});
