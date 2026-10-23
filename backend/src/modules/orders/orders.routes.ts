import { Router } from 'express';
import { createOrder, getOrderByCode } from './orders.controller';
import { validate } from '../../middlewares/validate';
import { orderPlacementLimiter, orderLookupLimiter } from '../../middlewares/rateLimiter';
import { createOrderSchema, getOrderStatusQuerySchema } from './orders.schema';

const router = Router();

router.post('/', orderPlacementLimiter, validate({ body: createOrderSchema }), createOrder);
router.get('/:code', orderLookupLimiter, validate({ query: getOrderStatusQuerySchema }), getOrderByCode);

export default router;
