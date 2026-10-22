import { z } from 'zod';

export const createProductSchema = z.object({
  slug: z.string().min(2).max(191),
  partNumber: z.string().min(1).max(100),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  condition: z.enum(['NEW', 'RECONDITIONED', 'USED']).default('NEW'),
  sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative'),
  stockQty: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  weightKg: z.coerce.number().positive().default(1.0),
  isActive: z.boolean().default(true),
  translations: z
    .array(
      z.object({
        language: z.enum(['en', 'si', 'ta']),
        name: z.string().min(1),
        description: z.string().min(1),
      })
    )
    .min(1, 'At least one translation is required'),
  images: z
    .array(
      z.object({
        imageUrl: z.string().url(),
        displayOrder: z.number().default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
  compatibilities: z
    .array(
      z.object({
        make: z.string().min(1),
        model: z.string().min(1),
        yearFrom: z.number().int(),
        yearTo: z.number().int().nullable().optional(),
        chassisCode: z.string().nullable().optional(),
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
