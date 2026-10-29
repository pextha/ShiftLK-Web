import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from './categories.schema';
import * as adminCategoriesController from './admin.categories.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN', 'STAFF']));

router.get('/', adminCategoriesController.getAdminCategories);
router.post('/', validateBody(createCategorySchema), adminCategoriesController.createCategory);
router.get('/:id', adminCategoriesController.getAdminCategoryById);
router.put('/:id', validateBody(updateCategorySchema), adminCategoriesController.updateCategory);
router.delete('/:id', requireRole(['ADMIN']), adminCategoriesController.deleteCategory);

export default router;
