import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Admin Analytics, Expenses & Swagger Documentation', () => {
  let authCookie = '';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@shiftlk.lk', password: 'ShiftAdmin@2026' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    authCookie = cookies.join('; ');
  });

  it('POST /api/v1/admin/expenses creates an expense record', async () => {
    const res = await request(app)
      .post('/api/v1/admin/expenses')
      .set('Cookie', authCookie)
      .send({
        type: 'SHIPPING',
        amount: 2500,
        note: 'Courier monthly bulk packaging materials',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('SHIPPING');
    expect(Number(res.body.data.amount)).toBe(2500);
  });

  it('GET /api/v1/admin/expenses lists expenses with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/admin/expenses')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/v1/admin/analytics/overview returns financial metrics (Revenue, COGS, Gross Profit, Net Profit)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(typeof data.revenue).toBe('number');
    expect(typeof data.cogs).toBe('number');
    expect(typeof data.grossProfit).toBe('number');
    expect(typeof data.totalExpenses).toBe('number');
    expect(typeof data.netProfit).toBe('number');
    expect(typeof data.pendingOrders).toBe('number');
    expect(typeof data.lowStockAlerts).toBe('number');
  });

  it('GET /api/v1/admin/analytics/sales returns timeline data', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/sales?days=7')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/analytics/top-products returns top product statistics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/top-products')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/admin/analytics/low-stock returns low stock warnings', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/low-stock?threshold=5')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/admin/audit-logs returns audit log entries', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/docs serves Swagger UI documentation', async () => {
    const res = await request(app).get('/api/docs/');
    expect([200, 301, 302]).toContain(res.status);
  });
});
