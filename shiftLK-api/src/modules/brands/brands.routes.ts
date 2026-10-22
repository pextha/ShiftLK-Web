import { Router } from 'express';
import { getAllBrands } from './brands.controller';

const router = Router();

router.get('/', getAllBrands);

export default router;
