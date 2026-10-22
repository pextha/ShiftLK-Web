import { Router } from 'express';
import { getAllCategories } from './categories.controller';

const router = Router();

router.get('/', getAllCategories);

export default router;
