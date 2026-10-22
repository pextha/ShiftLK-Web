import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import * as analyticsController from './analytics.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

router.get('/overview', analyticsController.getOverview);
router.get('/sales', analyticsController.getSalesTimeline);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/low-stock', analyticsController.getLowStock);

export default router;
