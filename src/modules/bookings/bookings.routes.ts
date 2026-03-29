import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { bookingsController } from './bookings.controller';
import { createBookingSchema, updateBookingStatusSchema } from './bookings.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Manage pet service bookings
 */

// All booking routes require authentication
router.use(authenticate);

// ─── User Routes ────────────────────────────────
/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service_id, package_id, booking_type, pet_ids]
 */
router.post('/', validate(createBookingSchema), asyncHandler(bookingsController.create.bind(bookingsController)));

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: List user's bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', asyncHandler(bookingsController.list.bind(bookingsController)));

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id', asyncHandler(bookingsController.getById.bind(bookingsController)));

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/cancel', asyncHandler(bookingsController.cancel.bind(bookingsController)));

// ─── Provider/Admin Routes ──────────────────────
/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (Provider/Admin)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.patch(
    '/:id/status',
    authorize('provider', 'admin'),
    validate(updateBookingStatusSchema),
    asyncHandler(bookingsController.updateStatus.bind(bookingsController))
);

export { router as bookingsRouter };
