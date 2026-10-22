import { Router } from 'express';
import { getAllDeliveryZones } from './delivery.controller';

const router = Router();

router.get('/', getAllDeliveryZones);

export default router;
