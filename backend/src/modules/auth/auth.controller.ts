import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { getCookieOptions, getClearCookieOptions } from '../../utils/cookies';
import { auditService } from '../audit/audit.service';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 mins
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { email, password } = req.body;
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  const clientIp = rawIp.replace(/^::ffff:/, '');

  try {
    const result = await authService.login(email, password, clientIp);

    res.cookie('access_token', result.accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
    res.cookie('refresh_token', result.refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));

    // Audit log successful login
    await auditService.log({
      userId: result.user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: result.user.id,
      ipAddress: clientIp,
    });

    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error: any) {
    // Audit log failed login
    await auditService.log({
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: String(email || 'unknown'),
      newValues: JSON.stringify({ message: error.message, code: error.code }),
      ipAddress: clientIp,
    });
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      res.status(401).json({
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token cookie or body parameter is required',
        },
      });
      return;
    }

    const result = await authService.refreshToken(token);
    res.cookie('access_token', result.accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));

    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const clearOptions = getClearCookieOptions();
  res.clearCookie('access_token', clearOptions);
  res.clearCookie('refresh_token', clearOptions);
  res.json({ data: { message: 'Successfully logged out' } });
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(userId, currentPassword, newPassword);

    await auditService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
    });

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}
