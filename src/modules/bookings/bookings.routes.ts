import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { bookingsController } from './bookings.controller';
import { createBookingSchema, updateBookingStatusSchema } from './bookings.schema';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// ─── User Routes ────────────────────────────────
router.post('/', validate(createBookingSchema), asyncHandler(bookingsController.create.bind(bookingsController)));
router.get('/', asyncHandler(bookingsController.list.bind(bookingsController)));
router.get('/:id', asyncHandler(bookingsController.getById.bind(bookingsController)));
router.post('/:id/cancel', asyncHandler(bookingsController.cancel.bind(bookingsController)));

// ─── Provider/Admin Routes ──────────────────────
router.patch(
    '/:id/status',
    authorize('provider', 'admin'),
    validate(updateBookingStatusSchema),
    asyncHandler(bookingsController.updateStatus.bind(bookingsController))
);

export { router as bookingsRouter };
