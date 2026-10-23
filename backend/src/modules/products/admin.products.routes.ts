import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createProductSchema, updateProductSchema, stockAdjustmentSchema } from './admin.products.schema';
import * as adminProductsController from './admin.products.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN', 'STAFF']));

// Specific subroutes first (before /:id)
router.get('/stock/overview', adminProductsController.getStockOverview);
router.get('/stock/movements', adminProductsController.getStockMovements);
router.get('/export-csv', adminProductsController.exportProductsCsv);
router.post('/bulk', adminProductsController.bulkProductsAction);

// CRUD
router.get('/', adminProductsController.getAdminProducts);
router.post('/', validateBody(createProductSchema), adminProductsController.createProduct);
router.get('/:id', adminProductsController.getAdminProductById);
router.put('/:id', validateBody(updateProductSchema), adminProductsController.updateProduct);
router.delete('/:id', requireRole(['ADMIN']), adminProductsController.deleteProduct);

// Stock Actions
router.post('/:id/restock', adminProductsController.restockProduct);
router.patch('/:id/stock', adminProductsController.inlineStockAdjustment);
router.post('/:id/stock', validateBody(stockAdjustmentSchema), adminProductsController.adjustStock);

export default router;
