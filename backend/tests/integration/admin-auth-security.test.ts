import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Admin Auth Security (Generic Errors, Lockout, and Audit Logging)', () => {
  const adminEmail = 'admin@shiftlk.lk';
  const adminPassword = 'ShiftAdmin@2026';
  const nonExistentEmail = 'nonexistent_user_999@shiftlk.lk';
  const lockoutTargetEmail = 'lockout_test_admin@shiftlk.lk';

  it('should return identical generic error messages and status 401 for wrong password and non-existent email', async () => {
    // 1. Existing user with wrong password
    const res1 = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: 'WrongPasswordXYZ999' });

    expect(res1.status).toBe(401);
    expect(res1.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res1.body.error.message).toBe('Invalid email or password');

    // 2. Non-existent user
    const res2 = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: nonExistentEmail, password: 'AnyPassword123' });

    expect(res2.status).toBe(401);
    expect(res2.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res2.body.error.message).toBe('Invalid email or password');

    // Messages must be identical to prevent user enumeration
    expect(res1.body.error.message).toEqual(res2.body.error.message);
  });

  it('should lock out account after 5 consecutive failed login attempts with HTTP 429', async () => {
    // Attempt 1 to 4 should return 401
    for (let i = 1; i <= 4; i++) {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: lockoutTargetEmail, password: 'WrongPassword' });
      expect(res.status).toBe(401);
    }

    // 5th attempt should trigger lockout (429)
    const res5 = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: lockoutTargetEmail, password: 'WrongPassword' });

    expect(res5.status).toBe(429);
    expect(res5.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(res5.body.error.message).toContain('locked');

    // Subsequent attempts during lockout should also be blocked with 429
    const res6 = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: lockoutTargetEmail, password: 'AnyPassword' });

    expect(res6.status).toBe(429);
    expect(res6.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('should record audit log for failed and successful logins', async () => {
    const failedLogs = await prisma.auditLog.findMany({
      where: { action: 'LOGIN_FAILED' },
      take: 1,
      orderBy: { createdAt: 'desc' },
    });
    expect(failedLogs.length).toBeGreaterThan(0);

    // Perform successful login
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(loginRes.status).toBe(200);

    const successLogs = await prisma.auditLog.findMany({
      where: { action: 'LOGIN_SUCCESS', userId: loginRes.body.data.user.id },
      take: 1,
      orderBy: { createdAt: 'desc' },
    });
    expect(successLogs.length).toBeGreaterThan(0);
  });
});
