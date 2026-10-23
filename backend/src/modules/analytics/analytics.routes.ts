import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import * as analyticsController from './analytics.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN', 'STAFF']));

router.get('/overview', analyticsController.getOverview);
router.get('/sales', analyticsController.getSalesTimeline);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/low-stock', analyticsController.getLowStock);
router.get('/reports', analyticsController.getReports);

export default router;
