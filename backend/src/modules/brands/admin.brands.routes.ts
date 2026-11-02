import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createBrandSchema, updateBrandSchema } from './brands.schema';
import * as adminBrandsController from './admin.brands.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN', 'STAFF']));

router.get('/', adminBrandsController.getAdminBrands);
router.post('/', validateBody(createBrandSchema), adminBrandsController.createBrand);
router.get('/:id', adminBrandsController.getAdminBrandById);
router.put('/:id', validateBody(updateBrandSchema), adminBrandsController.updateBrand);
router.delete('/:id', requireRole(['ADMIN']), adminBrandsController.deleteBrand);

export default router;

