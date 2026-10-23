import { z } from 'zod';

export const getProductsQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(['new', 'reconditioned', 'used', 'all']).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStockOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  locale: z.enum(['en', 'si', 'ta']).default('en'),
});

export const getProductBySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const getProductBySlugQuerySchema = z.object({
  locale: z.enum(['en', 'si', 'ta']).default('en'),
});
