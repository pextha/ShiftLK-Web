import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';
import {
  AuthUserPayload,
  getUserTokenVersion,
  bumpUserTokenVersion,
  isTokenRevoked,
} from '../../middlewares/auth';

interface LockoutEntry {
  attempts: number;
  lockedUntil?: number;
}

const lockoutStore = new Map<string, LockoutEntry>();
const accountLockoutStore = new Map<string, LockoutEntry>();
// Dummy hash to prevent timing attacks when email does not exist
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuuabcdefghijk';

export class AuthService {
  async login(email: string, passwordPlain: string, clientIp: string = '127.0.0.1') {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanIp = (clientIp || '127.0.0.1').replace(/^::ffff:/, '').trim();
    const lockoutKey = `${cleanIp}:${normalizedEmail}`;
    const accountKey = `acct:${normalizedEmail}`;
    const now = Date.now();

    const entry = lockoutStore.get(lockoutKey);
    const acctEntry = accountLockoutStore.get(accountKey);

    if (entry && entry.lockedUntil && entry.lockedUntil > now) {
      const remainingMinutes = Math.ceil((entry.lockedUntil - now) / (60 * 1000));
      throw new AppError(
        'ACCOUNT_LOCKED',
        `Too many failed attempts from this device. Please try again in ${remainingMinutes} minute(s).`,
        429
      );
    }

    if (acctEntry && acctEntry.lockedUntil && acctEntry.lockedUntil > now) {
      const remainingMinutes = Math.ceil((acctEntry.lockedUntil - now) / (60 * 1000));
      throw new AppError(
        'ACCOUNT_LOCKED',
        `Account temporarily locked due to excessive failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        429
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(passwordPlain, hashToCompare);

    if (!user || !user.isActive || !isMatch || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      const currentAttempts = (entry?.attempts || 0) + 1;
      let lockedUntil: number | undefined;

      if (currentAttempts >= env.LOCKOUT_MAX_ATTEMPTS) {
        lockedUntil = now + env.LOCKOUT_MINUTES * 60 * 1000;
      }
      lockoutStore.set(lockoutKey, { attempts: currentAttempts, lockedUntil });

      // Global per-account counter (locks account after 10 failures across any IPs)
      const acctAttempts = (acctEntry?.attempts || 0) + 1;
      const acctLockedUntil =
        acctAttempts >= env.LOCKOUT_MAX_ATTEMPTS * 2
          ? now + env.LOCKOUT_MINUTES * 60 * 1000
          : undefined;
      accountLockoutStore.set(accountKey, { attempts: acctAttempts, lockedUntil: acctLockedUntil });

      if (lockedUntil || acctLockedUntil) {
        throw new AppError(
          'ACCOUNT_LOCKED',
          `Too many failed attempts. Access from this device is temporarily locked for ${env.LOCKOUT_MINUTES} minutes.`,
          429
        );
      }

      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Reset lockout entries on successful authentication
    lockoutStore.delete(lockoutKey);
    accountLockoutStore.delete(accountKey);

    const tv = getUserTokenVersion(user.id);
    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF',
      name: user.name,
      tv,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ id: user.id, tv }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return {
      user: payload,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenString: string) {
    try {
      if (isTokenRevoked(refreshTokenString)) {
        throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token has been revoked', 401);
      }

      const decoded = jwt.verify(refreshTokenString, env.JWT_REFRESH_SECRET) as {
        id: string;
        tv?: number;
      };

      if (decoded.tv !== undefined && decoded.tv < getUserTokenVersion(decoded.id)) {
        throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token has been invalidated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
        throw new AppError('USER_INACTIVE', 'User account is no longer active or permitted', 401);
      }

      const tv = getUserTokenVersion(user.id);
      const payload: AuthUserPayload = {
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'STAFF',
        name: user.name,
        tv,
      };

      const accessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
      });

      const refreshToken = jwt.sign({ id: user.id, tv }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      });

      return {
        user: payload,
        accessToken,
        refreshToken,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired', 401);
    }
  }

  async changePassword(userId: string, currentPasswordPlain: string, newPasswordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
    if (!isMatch) {
      throw new AppError('INVALID_CREDENTIALS', 'Current password does not match', 400);
    }

    const newHash = await bcrypt.hash(newPasswordPlain, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all prior tokens for this user
    bumpUserTokenVersion(userId);

    return { message: 'Password successfully updated' };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User profile not found', 404);
    }

    return user;
  }

  resetLockout(email: string, clientIp: string = '127.0.0.1') {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanIp = (clientIp || '127.0.0.1').replace(/^::ffff:/, '').trim();
    lockoutStore.delete(`${cleanIp}:${normalizedEmail}`);
    accountLockoutStore.delete(`acct:${normalizedEmail}`);
  }

  clearAllLockouts() {
    lockoutStore.clear();
    accountLockoutStore.clear();
  }
}

export const authService = new AuthService();
