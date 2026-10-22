import { z } from 'zod';

export const createExpenseSchema = z.object({
  type: z.enum([
    'INVENTORY',
    'SHIPPING',
    'SALARY',
    'UTILITY',
    'RENT',
    'MARKETING',
    'OTHER',
  ]),
  amount: z.coerce.number().positive('Expense amount must be positive'),
  date: z.string().datetime().optional().or(z.string().date().optional()),
  note: z.string().max(500).optional(),
});
