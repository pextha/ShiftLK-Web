import { CookieOptions } from 'express';
import { env } from '../config/env';

export function getCookieOptions(maxAgeMs?: number): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  const options: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };

  if (maxAgeMs !== undefined) {
    options.maxAge = maxAgeMs;
  }

  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.trim() !== '') {
    options.domain = env.COOKIE_DOMAIN.trim();
  }

  return options;
}

export function getClearCookieOptions(): CookieOptions {
  return getCookieOptions(0);
}
