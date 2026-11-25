import { z } from 'zod';

export const createReservationSchema = z.object({
  productId: z.string().min(1, 'Product ID is required').max(100),
  qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(99),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(9, 'Phone number is required').max(25),
  secondaryPhone: z.string().max(25).optional(),
  address: z.string().min(5, 'Delivery address must be at least 5 characters').max(300),
  district: z.string().min(2, 'District is required').max(60),
  notes: z.string().max(500).optional(),
  locale: z.enum(['en', 'si', 'ta']).default('en'),
  reservationId: z.string().max(100).optional(),
  paymentSlipUrl: z.string().min(5, 'Payment slip or PDF upload is required').max(1000),
  transferRemark: z.string().max(255).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required').max(100),
        qty: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'Order must contain at least one item')
    .max(50, 'Order cannot contain more than 50 distinct line items'),
  // Honeypot field for bot detection
  _hp: z.string().max(0, 'Bot detected').optional(),
});

export const getOrderStatusQuerySchema = z.object({
  phone: z.string().min(9, 'Phone number is required for verification').max(25),
});
