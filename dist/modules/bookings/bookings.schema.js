"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBookingsQuerySchema = exports.updateBookingStatusSchema = exports.cancelBookingSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
// ─── Request Schemas ─────────────────────────────
exports.createBookingSchema = zod_1.z.object({
    service_id: zod_1.z.string().uuid(),
    package_id: zod_1.z.string().uuid(),
    booking_type: zod_1.z.enum(['instant', 'scheduled']),
    booking_date: zod_1.z.string().optional(),
    slot_id: zod_1.z.string().uuid().optional(),
    pet_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    addon_ids: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
    address: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
    coupon_code: zod_1.z.string().optional(),
});
exports.cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['confirmed', 'in_progress', 'completed']),
});
exports.listBookingsQuerySchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
//# sourceMappingURL=bookings.schema.js.map