import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Admin CORS and Cookie Configuration', () => {
  const adminEmail = 'admin@shiftlk.lk';
  const adminPassword = 'ShiftAdmin@2026';

  it('should accept CORS preflight from FRONTEND_ORIGIN (http://localhost:3000) with credentials', async () => {
    const res = await request(app)
      .options('/api/v1/admin/auth/me')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should accept CORS preflight from ADMIN_ORIGIN (http://localhost:3001) with credentials', async () => {
    const res = await request(app)
      .options('/api/v1/admin/auth/me')
      .set('Origin', 'http://localhost:3001')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should reject CORS from unauthorized origin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Origin', 'https://malicious-website.com');

    // CORS middleware either errors or does not return allow-origin header for unauthorized origin
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('POST /login should set httpOnly and SameSite=Lax cookies for both access and refresh tokens', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .set('Origin', 'http://localhost:3001')
      .send({ email: adminEmail, password: adminPassword });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();

    const accessCookie = cookies.find((c) => c.startsWith('access_token='));
    expect(accessCookie).toBeDefined();
    expect(accessCookie).toContain('HttpOnly');
    expect(accessCookie?.toLowerCase()).toContain('samesite=lax');

    const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie?.toLowerCase()).toContain('samesite=lax');
  });
});
