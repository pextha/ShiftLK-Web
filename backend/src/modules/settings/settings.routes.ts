import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { validateSriLankanPhone } from '../../utils/phoneValidator';
import * as settingsController from './settings.controller';

const updateSystemSettingsSchema = z.object({
  defaultLowStockAlert: z.coerce.number().int().min(1).max(10000).optional(),
  whatsappNumber: z
    .string()
    .min(9)
    .max(25)
    .refine((val) => validateSriLankanPhone(val).isValid, {
      message: 'WhatsApp number must be a valid Sri Lankan mobile number',
    })
    .optional(),
  hideProfitFromStaff: z.boolean().optional(),
});

const updateDeliveryZoneSchema = z.object({
  baseFee: z.coerce.number().min(0).max(100000).optional(),
  extraPerKg: z.coerce.number().min(0).max(100000).optional(),
  estimatedDays: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

const router = Router();

router.use(requireAuth);

router.get('/', settingsController.getSettings);
router.put(
  '/',
  requireRole(['ADMIN']),
  validateBody(updateSystemSettingsSchema),
  settingsController.updateSystemSettings
);
router.put(
  '/delivery-zones/:id',
  requireRole(['ADMIN']),
  validateBody(updateDeliveryZoneSchema),
  settingsController.updateDeliveryZone
);

export default router;
