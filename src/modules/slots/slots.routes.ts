import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { slotsController } from './slots.controller';
import { createSlotsSchema } from './slots.schema';

const router = Router();

// Public
router.get('/provider/:providerId', asyncHandler(slotsController.getByProvider.bind(slotsController)));

// Protected
router.post('/:slotId/lock', authenticate, asyncHandler(slotsController.lockSlot.bind(slotsController)));
router.delete('/:slotId/lock', authenticate, asyncHandler(slotsController.releaseLock.bind(slotsController)));

// Provider Only
router.get('/me', authenticate, authorize('provider'), asyncHandler(slotsController.getMySlots.bind(slotsController)));
router.post('/bulk', authenticate, authorize('provider'), validate(createSlotsSchema), asyncHandler(slotsController.bulkCreate.bind(slotsController)));
router.patch('/:id/block', authenticate, authorize('provider'), asyncHandler(slotsController.toggleBlock.bind(slotsController)));

export { router as slotsRouter };
