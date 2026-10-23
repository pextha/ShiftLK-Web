import { z } from 'zod';

export const createProductSchema = z.object({
  slug: z.string().min(2).max(191),
  partNumber: z
    .string()
    .default('')
    .transform((val) => val.trim() || `PART-${Date.now().toString(36).toUpperCase()}`),
  brandId: z.string().min(1, 'Please select a brand'),
  categoryId: z.string().min(1, 'Please select a category'),
  condition: z.enum(['NEW', 'RECONDITIONED', 'USED']).default('NEW'),
  sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').default(0),
  stockQty: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
  lowStockThreshold: z.coerce.number().int().min(1, 'Threshold must be at least 1').default(5),
  weightKg: z.coerce.number().positive().default(1.0),
  isActive: z.boolean().default(true),
  translations: z
    .array(
      z.object({
        language: z.enum(['en', 'si', 'ta']),
        name: z.string().min(1, 'Product name is required'),
        description: z.string().default(''),
      })
    )
    .min(1, 'At least one translation is required'),
  images: z
    .array(
      z.object({
        imageUrl: z.string().min(1, 'Image URL cannot be empty'),
        displayOrder: z.coerce.number().default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
  compatibilities: z
    .array(
      z.object({
        make: z.string().min(1),
        model: z.string().min(1),
        yearFrom: z.coerce.number().int(),
        yearTo: z.preprocess(
          (val) => (val === '' || val === undefined ? null : val),
          z.coerce.number().int().nullable().optional()
        ),
        chassisCode: z.preprocess(
          (val) => (val === '' || val === undefined ? null : val),
          z.string().nullable().optional()
        ),
      })
    )
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantityChange: z.coerce.number().int(),
  reason: z.enum(['RESTOCK', 'DAMAGE', 'RETURN', 'AUDIT_CORRECTION', 'OTHER']),
  note: z.string().max(300).optional(),
});
