import { Router } from 'express';
import {
  createOrder,
  getOrderByCode,
  createReservation,
  extendReservation,
  releaseReservation,
} from './orders.controller';
import { uploadSlipMiddleware, uploadPaymentSlip } from '../uploads/uploads.controller';
import { validate } from '../../middlewares/validate';
import { orderPlacementLimiter, orderLookupLimiter } from '../../middlewares/rateLimiter';
import { createOrderSchema, getOrderStatusQuerySchema, createReservationSchema } from './orders.schema';

const router = Router();

router.post('/reservations', validate({ body: createReservationSchema }), createReservation);
router.post('/reservations/:id/extend', extendReservation);
router.delete('/reservations/:id', releaseReservation);
router.post('/upload-slip', orderPlacementLimiter, uploadSlipMiddleware.single('file'), uploadPaymentSlip);

router.post('/', orderPlacementLimiter, validate({ body: createOrderSchema }), createOrder);
router.get('/:code', orderLookupLimiter, validate({ query: getOrderStatusQuerySchema }), getOrderByCode);

export default router;
