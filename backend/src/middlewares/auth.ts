import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  name: string;
  tv?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

// Token revocation & per-user session version tracking
const revokedTokens = new Set<string>();
const userTokenVersions = new Map<string, number>();

export function revokeToken(token?: string): void {
  if (token && typeof token === 'string') {
    revokedTokens.add(token);
  }
}

export function isTokenRevoked(token?: string): boolean {
  if (!token) return true;
  return revokedTokens.has(token);
}

export function getUserTokenVersion(userId: string): number {
  return userTokenVersions.get(userId) || 1;
}

export function bumpUserTokenVersion(userId: string): number {
  const next = getUserTokenVersion(userId) + 1;
  userTokenVersions.set(userId, next);
  return next;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // 1. Check httpOnly cookie first, then fallback to Authorization header
    let token = req.cookies?.access_token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new AppError('UNAUTHORIZED', 'Authentication token is required', 401);
    }

    if (isTokenRevoked(token)) {
      throw new AppError('TOKEN_REVOKED', 'Session has been logged out or revoked', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;

    if (decoded.tv !== undefined && decoded.tv < getUserTokenVersion(decoded.id)) {
      throw new AppError('SESSION_INVALIDATED', 'Session invalidated due to security change', 401);
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error.name === 'TokenExpiredError') {
      next(new AppError('TOKEN_EXPIRED', 'Access token has expired', 401));
      return;
    }
    next(new AppError('INVALID_TOKEN', 'Invalid or tampered authentication token', 401));
  }
}

export function requireRole(allowedRoles: Array<'ADMIN' | 'STAFF'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('UNAUTHORIZED', 'Authentication is required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          'FORBIDDEN',
          `Insufficient permissions. Requires one of: [${allowedRoles.join(', ')}]`,
          403
        )
      );
      return;
    }

    next();
  };
}
