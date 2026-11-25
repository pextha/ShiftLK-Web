import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ]),
  notes: z.string().max(500).optional(),
  trackingNumber: z.string().max(100).optional(),
});

export const updateOrderNotesSchema = z.object({
  adminNotes: z.string().max(1000).optional(),
  trackingNumber: z.string().max(100).optional(),
});

export const createPosOrderSchema = z.object({
  customerName: z.string().max(150).optional().default('Walk-In Customer'),
  phone: z.string().max(30).optional(),
  secondaryPhone: z.string().max(30).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD_QR']).default('CASH'),
  discountAmount: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(999),
        customUnitPrice: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, 'Sale must contain at least one item')
    .max(50, 'Cannot exceed 50 distinct items per bill'),
});
