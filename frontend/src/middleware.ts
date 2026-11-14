import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing, type Locale } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * 4-Tier Locale Resolution:
 * 1. Visitor's manually saved language (SHIFTLK_LOCALE cookie)
 * 2. Browser language (Accept-Language: 'ta' -> Tamil, 'si' -> Sinhala)
 * 3. IP Country via Cloudflare ('cf-ipcountry' === 'LK' -> Sinhala, other country -> English)
 * 4. Default: 'en' (English)
 */
function detectPreferredLocale(request: NextRequest): {
  locale: Locale;
  countryCode: string | null;
} {
  const cfCountry =
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country-code') ||
    null;
  const countryCode = cfCountry ? cfCountry.toUpperCase() : null;

  // Tier 1: Visitor manually chosen language cookie
  const manualLocale = request.cookies.get('SHIFTLK_LOCALE')?.value as
    | Locale
    | undefined;
  if (manualLocale && routing.locales.includes(manualLocale)) {
    return { locale: manualLocale, countryCode };
  }

  // Tier 2: Browser Accept-Language ('ta' -> Tamil, 'si' -> Sinhala)
  const acceptLang = request.headers.get('accept-language') || '';
  const langTags = acceptLang
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean);

  for (const tag of langTags) {
    if (tag === 'ta' || tag.startsWith('ta-')) {
      return { locale: 'ta', countryCode };
    }
    if (tag === 'si' || tag.startsWith('si-')) {
      return { locale: 'si', countryCode };
    }
  }

  // Tier 3: IP Location via Cloudflare (Sri Lanka 'LK' -> Sinhala, other countries -> English)
  if (countryCode) {
    if (countryCode === 'LK') {
      return { locale: 'si', countryCode };
    }
    return { locale: 'en', countryCode };
  }

  // Tier 4: Default fallback -> English
  return { locale: 'en', countryCode };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow Next.js internals, API routes, and files with extensions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Admin Routes Protection (/admin/*)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const accessToken = request.cookies.get('access_token')?.value;

    // Login page: if already logged in, redirect to dashboard
    if (pathname === '/admin/login') {
      if (accessToken) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Root /admin: redirect to dashboard if logged in, otherwise login
    if (pathname === '/admin') {
      if (accessToken) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Protected admin pages: require access_token
    if (!accessToken) {
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin/dashboard') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 3. Customer Storefront: Smart 4-Tier Language Detection on entry paths without explicit locale prefix
  const hasExplicitLocalePrefix = routing.locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  );

  const { locale: detectedLocale, countryCode } = detectPreferredLocale(request);

  // If the visitor lands on a path without an explicit /si or /ta prefix (e.g., '/')
  // and our 4-tier detector resolves 'si' or 'ta', redirect cleanly to that locale
  if (!hasExplicitLocalePrefix && detectedLocale !== routing.defaultLocale) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      pathname === '/' ? `/${detectedLocale}` : `/${detectedLocale}${pathname}`;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    if (countryCode) {
      response.cookies.set('SHIFTLK_COUNTRY', countryCode, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
    }
    return response;
  }

  const response = intlMiddleware(request);
  if (countryCode) {
    response.cookies.set('SHIFTLK_COUNTRY', countryCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
