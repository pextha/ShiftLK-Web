import { MetadataRoute } from 'next';
import { SEED_RAW_PRODUCTS } from '@/lib/db/seed-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shiftlk.lk';
  const locales = ['en', 'si', 'ta'];
  const staticRoutes = ['', '/products', '/about', '/delivery', '/returns', '/contact'];

  const entries: MetadataRoute.Sitemap = [];

  // Static routes for each locale
  locales.forEach((locale) => {
    staticRoutes.forEach((route) => {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1.0 : 0.8,
      });
    });

    // Product routes for each locale
    SEED_RAW_PRODUCTS.forEach((p) => {
      entries.push({
        url: `${baseUrl}/${locale}/products/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  });

  return entries;
}
