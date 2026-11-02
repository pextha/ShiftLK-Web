import { MetadataRoute } from 'next';
import { SEED_RAW_PRODUCTS } from '@/lib/db/seed-data';
import { getProducts } from '@/services/productService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shiftlk.lk';
  const locales = ['en', 'si', 'ta'];
  const staticRoutes = ['', '/products', '/track-order', '/about', '/delivery', '/returns', '/contact'];

  const entries: MetadataRoute.Sitemap = [];

  let productSlugs: string[] = [];
  try {
    const liveProducts = await getProducts('en', { limit: 100 });
    if (liveProducts && liveProducts.length > 0) {
      productSlugs = liveProducts.map((p) => p.slug);
    }
  } catch {}

  if (productSlugs.length === 0) {
    productSlugs = SEED_RAW_PRODUCTS.map((p) => p.slug);
  }

  // Static routes and product routes for each locale
  locales.forEach((locale) => {
    staticRoutes.forEach((route) => {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1.0 : 0.8,
      });
    });

    productSlugs.forEach((slug) => {
      entries.push({
        url: `${baseUrl}/${locale}/products/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  });

  return entries;
}
