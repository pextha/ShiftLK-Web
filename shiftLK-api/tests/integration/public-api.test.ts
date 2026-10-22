import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Public REST API Endpoints', () => {
  it('GET /health returns 200 healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/v1/delivery-zones returns 25 active Sri Lankan districts', async () => {
    const res = await request(app).get('/api/v1/delivery-zones');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(25);

    const colombo = res.body.data.find((z: any) => z.district === 'Colombo');
    expect(colombo).toBeDefined();
    expect(typeof colombo.base_fee).toBe('number');
  });

  it('GET /api/v1/categories returns categories with multilingual translations', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const cat = res.body.data[0];
    expect(cat.name).toBeDefined();
    expect(cat.slug).toBeDefined();
  });

  it('GET /api/v1/brands returns brands list', async () => {
    const res = await request(app).get('/api/v1/brands');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/products strictly NEVER leaks cost_price to the public', async () => {
    const res = await request(app).get('/api/v1/products?limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);

    for (const item of res.body.data) {
      expect(item).not.toHaveProperty('cost_price');
      expect(item).not.toHaveProperty('costPrice');
      expect(item).toHaveProperty('selling_price');
      expect(item).toHaveProperty('part_number');
      expect(item).toHaveProperty('stock_qty');
    }
  });

  it('GET /api/v1/products/:slug returns product details without cost_price', async () => {
    const listRes = await request(app).get('/api/v1/products?limit=1');
    const firstSlug = listRes.body.data[0].slug;

    const res = await request(app).get(`/api/v1/products/${firstSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.slug).toBe(firstSlug);
    expect(res.body.data).not.toHaveProperty('cost_price');
    expect(res.body.data).not.toHaveProperty('costPrice');
  });

  it('GET /api/v1/products/non-existent-product returns 404 with error payload', async () => {
    const res = await request(app).get('/api/v1/products/non-existent-slug-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });
});
