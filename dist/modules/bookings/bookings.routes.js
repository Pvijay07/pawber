"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const bookings_controller_1 = require("./bookings.controller");
const bookings_schema_1 = require("./bookings.schema");
const router = (0, express_1.Router)();
exports.bookingsRouter = router;
/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Manage pet service bookings
 */
// All booking routes require authentication
router.use(middleware_1.authenticate);
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
router.post('/', (0, middleware_1.validate)(bookings_schema_1.createBookingSchema), (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.create.bind(bookings_controller_1.bookingsController)));
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: List user's bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.list.bind(bookings_controller_1.bookingsController)));
/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id', (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.getById.bind(bookings_controller_1.bookingsController)));
/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/cancel', (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.cancel.bind(bookings_controller_1.bookingsController)));
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
router.patch('/:id/status', (0, middleware_1.authorize)('provider', 'admin'), (0, middleware_1.validate)(bookings_schema_1.updateBookingStatusSchema), (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.updateStatus.bind(bookings_controller_1.bookingsController)));
//# sourceMappingURL=bookings.routes.js.map