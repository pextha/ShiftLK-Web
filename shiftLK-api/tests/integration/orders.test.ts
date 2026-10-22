import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('POST /api/v1/orders (Public Order Placement)', () => {
  let sampleProduct: any;

  beforeAll(async () => {
    sampleProduct = await prisma.product.findFirst({
      where: { isActive: true, stockQty: { gt: 5 } },
    });
  });

  it('should successfully place an order and return formatted WhatsApp URL and sequential order code', async () => {
    expect(sampleProduct).toBeDefined();

    const orderPayload = {
      customerName: 'Nimal Jayasuriya',
      phone: '077 123 4567',
      address: 'No. 25, Kandy Road, Kadawatha',
      district: 'Gampaha',
      items: [
        {
          productId: sampleProduct.id,
          qty: 2,
        },
      ],
      notes: 'Please call before delivery',
      locale: 'en',
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(orderPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();

    const data = res.body.data;
    // Sequential order code format: SLK-XXXXXX (e.g. SLK-000125)
    expect(data.orderCode).toMatch(/^SLK-\d{6}$/);
    expect(data.status).toBe('PENDING');
    expect(data.subtotal).toBe(Number(sampleProduct.sellingPrice) * 2);
    expect(data.deliveryCost).toBeGreaterThan(0);
    expect(data.total).toBe(data.subtotal + data.deliveryCost);
    expect(data.whatsAppUrl).toContain('https://wa.me/94770871018?text=');
    expect(data.whatsAppMessage).toContain(data.orderCode);
    expect(data.whatsAppMessage).toContain('Nimal Jayasuriya');

    // Verify order was saved in database with correct customer phone (+94771234567)
    const dbOrder = await prisma.order.findUnique({
      where: { orderCode: data.orderCode },
      include: { items: true },
    });

    expect(dbOrder).toBeDefined();
    expect(dbOrder?.phone).toBe('+94771234567');
    expect(dbOrder?.items.length).toBe(1);
    expect(dbOrder?.items[0].qty).toBe(2);
  });

  it('should reject order if honeypot (_hp) field is populated by a spam bot', async () => {
    const spamPayload = {
      customerName: 'Bot User',
      phone: '0771234567',
      address: 'Bot Street',
      district: 'Colombo',
      items: [{ productId: sampleProduct.id, qty: 1 }],
      _hp: 'http://spam-link.com',
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(spamPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should reject order with invalid Sri Lankan phone number (unsupported prefix or format)', async () => {
    // 073 is not a mobile prefix in Sri Lanka
    const invalidPhonePayload = {
      customerName: 'Test User',
      phone: '0731234567',
      address: 'Test Street',
      district: 'Colombo',
      items: [{ productId: sampleProduct.id, qty: 1 }],
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(invalidPhonePayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_PHONE');
  });

  it('should reject order with unknown or inactive district', async () => {
    const invalidDistrictPayload = {
      customerName: 'Test User',
      phone: '0771234567',
      address: 'Test Street',
      district: 'NonExistentDistrict',
      items: [{ productId: sampleProduct.id, qty: 1 }],
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(invalidDistrictPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_DISTRICT');
  });

  it('should reject order if requested quantity exceeds current stock', async () => {
    const excessiveQtyPayload = {
      customerName: 'Test User',
      phone: '0771234567',
      address: 'Test Street',
      district: 'Colombo',
      items: [{ productId: sampleProduct.id, qty: 99999 }],
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(excessiveQtyPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toContain('Insufficient stock');
  });
});
