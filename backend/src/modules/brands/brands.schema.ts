import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z
    .string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(150, 'Brand name cannot exceed 150 characters')
    .trim(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(150, 'Slug cannot exceed 150 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  country: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateBrandSchema = z.object({
  name: z
    .string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(150, 'Brand name cannot exceed 150 characters')
    .trim()
    .optional(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(150, 'Slug cannot exceed 150 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')
    .optional(),
  country: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

