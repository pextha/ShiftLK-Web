import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Cloudflare R2 Object Storage Integration', () => {
  let adminToken: string;
  let uploadedKey: string = '';

  beforeAll(async () => {
    // Authenticate as Admin to get valid access token
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@shiftlk.lk', password: 'ShiftAdmin@2026' });

    expect(res.status).toBe(200);
    adminToken = res.body.data.accessToken;
  });

  it('should reject unauthenticated upload requests with 401', async () => {
    const res = await request(app)
      .post('/api/v1/admin/uploads')
      .attach('file', Buffer.from('fake image data'), 'test.png');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should upload an image buffer directly to Cloudflare R2 and return public URL', async () => {
    // Create a 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );

    const res = await request(app)
      .post('/api/v1/admin/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', pngBuffer, 'test-pixel.png')
      .field('folder', 'products');

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.key).toContain('products/');
    expect(res.body.data.key).toContain('.png');
    expect(res.body.data.url).toBeDefined();
    expect(res.body.data.mimeType).toBe('image/png');

    uploadedKey = res.body.data.key;
  });

  it('should generate an S3 presigned PUT URL for client-side direct uploads', async () => {
    const res = await request(app)
      .post('/api/v1/admin/uploads/presigned-url')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fileName: 'front-sprocket.webp',
        fileType: 'image/webp',
        folder: 'products',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.uploadUrl).toBeDefined();
    expect(res.body.data.uploadUrl).toContain('r2.cloudflarestorage.com');
    expect(res.body.data.key).toContain('products/');
    expect(res.body.data.publicUrl).toBeDefined();
  });

  it('should stream the uploaded object from Cloudflare R2 via media route', async () => {
    if (!uploadedKey) return;

    const res = await request(app).get(`/api/v1/media/${uploadedKey}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toContain('public');
    expect(res.body).toBeDefined();
  });

  it('should return 404 for non-existent media on public stream route', async () => {
    const res = await request(app).get('/api/v1/media/non-existent-image-999.png');
    expect(res.status).toBe(404);
  });

  it('should delete the uploaded test file from Cloudflare R2', async () => {
    if (!uploadedKey) return;

    const res = await request(app)
      .delete('/api/v1/admin/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: uploadedKey });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);

    // Verify it is gone
    const getRes = await request(app).get(`/api/v1/media/${uploadedKey}`);
    expect(getRes.status).toBe(404);
  });
});
