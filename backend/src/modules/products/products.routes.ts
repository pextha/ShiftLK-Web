import { Router } from 'express';
import { getProducts, getProductBySlug } from './products.controller';
import { validate } from '../../middlewares/validate';
import {
  getProductsQuerySchema,
  getProductBySlugParamsSchema,
  getProductBySlugQuerySchema,
} from './products.schema';

const router = Router();

router.get('/', validate({ query: getProductsQuerySchema }), getProducts);
router.get(
  '/:slug',
  validate({
    params: getProductBySlugParamsSchema,
    query: getProductBySlugQuerySchema,
  }),
  getProductBySlug
);

export default router;
