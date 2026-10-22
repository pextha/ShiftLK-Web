import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env';

const COOKIE_OPTIONS_ACCESS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 mins
};

const COOKIE_OPTIONS_REFRESH = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('access_token', result.accessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie('refresh_token', result.refreshToken, COOKIE_OPTIONS_REFRESH);

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
    res.cookie('access_token', result.accessToken, COOKIE_OPTIONS_ACCESS);

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
  const clearOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };
  res.clearCookie('access_token', clearOptions);
  res.clearCookie('refresh_token', clearOptions);
  res.json({ data: { message: 'Successfully logged out' } });
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}
