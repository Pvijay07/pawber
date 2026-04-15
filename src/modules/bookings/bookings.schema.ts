import { z } from 'zod';

// ─── Request Schemas ─────────────────────────────

export const createBookingSchema = z.object({
    service_id: z.string().uuid(),
    package_id: z.string().uuid(),
    booking_type: z.enum(['instant', 'scheduled']),
    booking_date: z.string().optional(),
    slot_id: z.string().uuid().optional(),
    pet_ids: z.array(z.string().uuid()).min(1),
    addon_ids: z.array(z.string().uuid()).optional().default([]),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    notes: z.string().optional(),
    coupon_code: z.string().optional(),
    points_to_use: z.number().optional().default(0),
});

export const cancelBookingSchema = z.object({
    reason: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
    status: z.enum(['confirmed', 'in_progress', 'completed']),
});

export const listBookingsQuerySchema = z.object({
    status: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

// ─── Inferred Types ──────────────────────────────

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
