import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import * as settingsController from './settings.controller';

const router = Router();

router.use(requireAuth);

router.get('/', settingsController.getSettings);
router.put('/', requireRole(['ADMIN']), settingsController.updateSystemSettings);
router.put('/delivery-zones/:id', requireRole(['ADMIN']), settingsController.updateDeliveryZone);

export default router;
