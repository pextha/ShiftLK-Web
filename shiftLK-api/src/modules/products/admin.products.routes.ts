import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createProductSchema, updateProductSchema, stockAdjustmentSchema } from './admin.products.schema';
import * as adminProductsController from './admin.products.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

router.get('/', adminProductsController.getAdminProducts);
router.post('/', validateBody(createProductSchema), adminProductsController.createProduct);
router.put('/:id', validateBody(updateProductSchema), adminProductsController.updateProduct);
router.delete('/:id', adminProductsController.deleteProduct);
router.post('/:id/stock', validateBody(stockAdjustmentSchema), adminProductsController.adjustStock);

export default router;
