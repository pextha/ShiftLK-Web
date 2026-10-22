import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
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

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
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

export function requireRole(allowedRoles: Array<'ADMIN' | 'STAFF' | 'SUPER_ADMIN'>) {
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
