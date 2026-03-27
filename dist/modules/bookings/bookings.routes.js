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
// All booking routes require authentication
router.use(middleware_1.authenticate);
// ─── User Routes ────────────────────────────────
router.post('/', (0, middleware_1.validate)(bookings_schema_1.createBookingSchema), (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.create.bind(bookings_controller_1.bookingsController)));
router.get('/', (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.list.bind(bookings_controller_1.bookingsController)));
router.get('/:id', (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.getById.bind(bookings_controller_1.bookingsController)));
router.post('/:id/cancel', (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.cancel.bind(bookings_controller_1.bookingsController)));
// ─── Provider/Admin Routes ──────────────────────
router.patch('/:id/status', (0, middleware_1.authorize)('provider', 'admin'), (0, middleware_1.validate)(bookings_schema_1.updateBookingStatusSchema), (0, utils_1.asyncHandler)(bookings_controller_1.bookingsController.updateStatus.bind(bookings_controller_1.bookingsController)));
//# sourceMappingURL=bookings.routes.js.map