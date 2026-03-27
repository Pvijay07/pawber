import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { walletController } from './wallet.controller';
import { addFundsSchema, paySchema, autoRechargeSchema } from './wallet.schema';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(walletController.get.bind(walletController)));
router.get('/transactions', asyncHandler(walletController.transactions.bind(walletController)));
router.post('/add-funds', validate(addFundsSchema), asyncHandler(walletController.addFunds.bind(walletController)));
router.post('/pay', validate(paySchema), asyncHandler(walletController.pay.bind(walletController)));
router.patch('/auto-recharge', validate(autoRechargeSchema), asyncHandler(walletController.autoRecharge.bind(walletController)));

export { router as walletRouter };
