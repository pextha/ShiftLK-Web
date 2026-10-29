import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Admin Category Management API', () => {
  let authCookie = '';
  let createdCategoryId = '';
  let linkedCategoryId = '';
  let linkedProductId = '';
  const testSlug = `test-cat-${Date.now()}`;

  beforeAll(async () => {
    // 1. Authenticate as admin
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@shiftlk.lk', password: 'ShiftAdmin@2026' });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    authCookie = cookies.join('; ');

    // 2. Create a category that will be linked to a product to test delete guard
    const linkedCat = await prisma.category.create({
      data: {
        slug: `linked-cat-${Date.now()}`,
        icon: 'Layers',
        displayOrder: 99,
        isActive: true,
        translations: {
          create: [
            { language: 'en', name: 'Linked Category EN' },
            { language: 'si', name: 'සම්බන්ධිත කාණ්ඩය' },
            { language: 'ta', name: 'இணைக்கப்பட்ட வகை' },
          ],
        },
      },
    });
    linkedCategoryId = linkedCat.id;

    const brand = await prisma.brand.findFirst();
    const prod = await prisma.product.create({
      data: {
        slug: `cat-guard-prod-${Date.now()}`,
        partNumber: `CGP-${Date.now()}`,
        brandId: brand!.id,
        categoryId: linkedCategoryId,
        sellingPrice: 2500,
        costPrice: 1800,
        stockQty: 10,
        lowStockThreshold: 5,
        isActive: true,
      },
    });
    linkedProductId = prod.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    if (linkedProductId) {
      await prisma.product.deleteMany({ where: { id: linkedProductId } });
    }
    if (linkedCategoryId) {
      await prisma.category.deleteMany({ where: { id: linkedCategoryId } });
    }
    if (createdCategoryId) {
      await prisma.category.deleteMany({ where: { id: createdCategoryId } });
    }
  });

  it('should reject unauthenticated requests to /api/v1/admin/categories with 401', async () => {
    const res = await request(app).get('/api/v1/admin/categories');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/admin/categories should create category with trilingual translations', async () => {
    const payload = {
      slug: testSlug,
      icon: 'Flame',
      displayOrder: 15,
      isActive: true,
      translations: {
        en: {
          name: 'High Performance Exhausts',
          description: 'Racing mufflers and headers',
        },
        si: {
          name: 'රේසිං සයිලන්සර්',
          description: 'වැඩි ධාවන ශක්තියක් සඳහා සයිලන්සර්',
        },
        ta: {
          name: 'ரேசிங் எக்ஸாஸ்ட்',
          description: 'அதிவேக செயல்திறன் எக்ஸாஸ்ட்',
        },
      },
    };

    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Cookie', authCookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.slug).toBe(testSlug);
    expect(res.body.data.icon).toBe('Flame');
    expect(res.body.data.displayOrder).toBe(15);
    expect(res.body.data.translations).toHaveLength(3);

    createdCategoryId = res.body.data.id;
  });

  it('POST /api/v1/admin/categories should reject duplicate slug with 409', async () => {
    const payload = {
      slug: testSlug,
      icon: 'Flame',
      translations: {
        en: { name: 'Duplicate Slug Attempt' },
      },
    };

    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Cookie', authCookie)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLUG_EXISTS');
  });

  it('GET /api/v1/admin/categories should return all categories with counts and translations', async () => {
    const res = await request(app)
      .get('/api/v1/admin/categories')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const found = res.body.data.find((c: any) => c.id === createdCategoryId);
    expect(found).toBeDefined();
    expect(found.translationsMap.en.name).toBe('High Performance Exhausts');
    expect(found.translationsMap.si.name).toBe('රේසිං සයිලන්සර්');
    expect(found.translationsMap.ta.name).toBe('ரேசிங் எக்ஸாஸ்ட்');
    expect(found.productsCount).toBe(0);
  });

  it('GET /api/v1/admin/categories/:id should return single category details', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/categories/${createdCategoryId}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdCategoryId);
    expect(res.body.data.slug).toBe(testSlug);
    expect(res.body.data.translationsMap.en.name).toBe('High Performance Exhausts');
  });

  it('PUT /api/v1/admin/categories/:id should update category and translations', async () => {
    const updatePayload = {
      displayOrder: 25,
      isActive: false,
      translations: {
        en: {
          name: 'Updated Performance Exhausts',
          description: 'Updated description',
        },
      },
    };

    const res = await request(app)
      .put(`/api/v1/admin/categories/${createdCategoryId}`)
      .set('Cookie', authCookie)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.data.displayOrder).toBe(25);
    expect(res.body.data.isActive).toBe(false);

    const enTrans = res.body.data.translations.find((t: any) => t.language === 'en');
    expect(enTrans.name).toBe('Updated Performance Exhausts');
  });

  it('DELETE /api/v1/admin/categories/:id should block deletion if products are linked (400)', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/categories/${linkedCategoryId}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CATEGORY_HAS_PRODUCTS');
  });

  it('DELETE /api/v1/admin/categories/:id should delete category when no products are linked', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/categories/${createdCategoryId}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);

    // Verify it is gone
    const verifyRes = await request(app)
      .get(`/api/v1/admin/categories/${createdCategoryId}`)
      .set('Cookie', authCookie);

    expect(verifyRes.status).toBe(404);
    createdCategoryId = ''; // Already deleted
  });
});
