export const DEFAULT_PRODUCT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80';

/**
 * Resolves a product image URL that may be stored as a Cloudflare R2 public URL,
 * an R2 private S3 endpoint URL (*.r2.cloudflarestorage.com/...), an absolute external URL,
 * a local public asset (`/images/...`), or a backend relative media proxy path (`/api/v1/media/...`).
 */
export function resolveProductImageUrl(url?: string | null): string {
  if (!url || !url.trim()) {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }

  const trimmed = url.trim();

  // Rewrite private Cloudflare R2 S3 API endpoint URLs (*.r2.cloudflarestorage.com/<key>)
  // to our public edge media proxy `/api/v1/media/<key>`
  const r2PrivateMatch = trimmed.match(
    /^https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/(?:shiftlkspares\/)?(.+)$/i
  );
  if (r2PrivateMatch && r2PrivateMatch[1]) {
    return `/api/v1/media/${r2PrivateMatch[1].replace(/^\/+/, '')}`;
  }

  // Rewrite localhost:4000/api/v1/media/... to relative /api/v1/media/... so Next.js rewrite handles it cleanly
  const localMediaMatch = trimmed.match(
    /^https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/api\/v1\/media\/(.+)$/i
  );
  if (localMediaMatch && localMediaMatch[1]) {
    return `/api/v1/media/${localMediaMatch[1].replace(/^\/+/, '')}`;
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/api/v1/media/')
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
 * or `/api/v1/media/...` proxy stream).
 */
export function isLocalOrUnoptimizedImage(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('/api/v1/media/') ||
    url.includes('.r2.cloudflarestorage.com')
  );
}
