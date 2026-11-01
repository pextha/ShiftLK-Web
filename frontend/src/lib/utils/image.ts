const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80';

/**
 * Resolves a product image URL that may be stored as a Cloudflare R2 public URL,
 * an absolute external URL, a local public asset (`/images/...`), or a backend
 * relative media proxy path (`/api/v1/media/...`).
 */
export function resolveProductImageUrl(url?: string | null): string {
  if (!url || !url.trim()) {
    return DEFAULT_PLACEHOLDER;
  }

  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/images/')
  ) {
    return trimmed;
  }

  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(
    /\/api\/v1\/?$/,
    ''
  );
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/**
 * Determines whether Next.js `<Image>` should bypass server-side image optimization
 * (e.g. when pointing to a loopback/local development server `localhost` / `127.0.0.1`
 * which Next.js blocks as a private IP, while keeping full optimization for Cloudflare R2 CDN).
 */
export function isLocalOrUnoptimizedImage(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('/api/v1/media/')
  );
}
