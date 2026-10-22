import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Admin Authentication (/api/v1/admin/auth)', () => {
  const adminEmail = 'admin@shiftlk.lk';
  const adminPassword = 'ShiftAdmin@2026';

  let accessToken = '';
  let refreshToken = '';
  let authCookie = '';

  it('POST /login with valid admin credentials should return 200 and set httpOnly cookies', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(adminEmail);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeDefined();

    accessToken = res.body.data.accessToken;

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);

    authCookie = cookies.join('; ');

    const refreshCookieStr = cookies.find((c) => c.startsWith('refresh_token='));
    if (refreshCookieStr) {
      refreshToken = refreshCookieStr.split(';')[0].replace('refresh_token=', '');
    }
  });

  it('POST /login with invalid credentials should return 401', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: 'WrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /me with auth cookie should return current admin profile', async () => {
    const res = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(adminEmail);
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('GET /me with Bearer token header should also be accepted', async () => {
    const res = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(adminEmail);
  });

  it('GET /me without token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/admin/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /refresh with valid refreshToken should issue a new accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /logout should clear authentication cookies', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.includes('access_token=;'))).toBe(true);
  });
});
