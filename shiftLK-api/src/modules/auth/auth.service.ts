import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';
import { AuthUserPayload } from '../../middlewares/auth';

export class AuthService {
  async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
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
      const decoded = jwt.verify(refreshTokenString, env.JWT_REFRESH_SECRET) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        throw new AppError('USER_INACTIVE', 'User account is no longer active', 401);
      }

      const payload: AuthUserPayload = {
        id: user.id,
        email: user.email,
        role: user.role as any,
        name: user.name,
      };

      const accessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
      });

      return {
        user: payload,
        accessToken,
      };
    } catch (err: any) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired', 401);
    }
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
}

export const authService = new AuthService();
