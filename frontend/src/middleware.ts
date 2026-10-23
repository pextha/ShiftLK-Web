import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

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

  // 3. Customer Storefront (next-intl localization for /, /en, /si, /ta)
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
