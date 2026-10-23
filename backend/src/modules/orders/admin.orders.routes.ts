import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { updateOrderStatusSchema, updateOrderNotesSchema } from './admin.orders.schema';
import * as adminOrdersController from './admin.orders.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN', 'STAFF']));

router.get('/', adminOrdersController.getAdminOrders);
router.get('/:id', adminOrdersController.getAdminOrderById);
router.patch('/:id/status', validateBody(updateOrderStatusSchema), adminOrdersController.updateOrderStatus);
router.patch('/:id/notes', validateBody(updateOrderNotesSchema), adminOrdersController.updateOrderNotes);

export default router;
