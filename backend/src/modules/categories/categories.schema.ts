import { z } from 'zod';

export const translationSchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters'),
  description: z.string().trim().optional().nullable(),
});

export const createCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  icon: z.string().trim().default('Wrench'),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.object({
    en: translationSchema,
    si: z
      .object({
        name: z.string().trim().optional().nullable(),
        description: z.string().trim().optional().nullable(),
      })
      .optional(),
    ta: z
      .object({
        name: z.string().trim().optional().nullable(),
        description: z.string().trim().optional().nullable(),
      })
      .optional(),
  }),
});

export const updateCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  icon: z.string().trim().optional(),
  displayOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
  translations: z
    .object({
      en: translationSchema.optional(),
      si: z
        .object({
          name: z.string().trim().optional().nullable(),
          description: z.string().trim().optional().nullable(),
        })
        .optional(),
      ta: z
        .object({
          name: z.string().trim().optional().nullable(),
          description: z.string().trim().optional().nullable(),
        })
        .optional(),
    })
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
