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
