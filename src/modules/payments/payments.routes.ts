import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { paymentsController } from './payments.controller';
import { createOrderSchema, verifyPaymentSchema, refundSchema } from './payments.schema';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(paymentsController.getHistory.bind(paymentsController)));
router.post('/create-order', validate(createOrderSchema), asyncHandler(paymentsController.createOrder.bind(paymentsController)));
router.post('/verify', validate(verifyPaymentSchema), asyncHandler(paymentsController.verifyPayment.bind(paymentsController)));
router.post('/refund', validate(refundSchema), asyncHandler(paymentsController.refund.bind(paymentsController)));

export { router as paymentsRouter };
