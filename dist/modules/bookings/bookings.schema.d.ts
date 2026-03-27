import { z } from 'zod';
export declare const createBookingSchema: z.ZodObject<{
    service_id: z.ZodString;
    package_id: z.ZodString;
    booking_type: z.ZodEnum<["instant", "scheduled"]>;
    booking_date: z.ZodOptional<z.ZodString>;
    slot_id: z.ZodOptional<z.ZodString>;
    pet_ids: z.ZodArray<z.ZodString, "many">;
    addon_ids: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    address: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    coupon_code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    service_id: string;
    package_id: string;
    booking_type: "instant" | "scheduled";
    pet_ids: string[];
    addon_ids: string[];
    booking_date?: string | undefined;
    slot_id?: string | undefined;
    address?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    notes?: string | undefined;
    coupon_code?: string | undefined;
}, {
    service_id: string;
    package_id: string;
    booking_type: "instant" | "scheduled";
    pet_ids: string[];
    booking_date?: string | undefined;
    slot_id?: string | undefined;
    addon_ids?: string[] | undefined;
    address?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    notes?: string | undefined;
    coupon_code?: string | undefined;
}>;
export declare const cancelBookingSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const updateBookingStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["confirmed", "in_progress", "completed"]>;
}, "strip", z.ZodTypeAny, {
    status: "confirmed" | "in_progress" | "completed";
}, {
    status: "confirmed" | "in_progress" | "completed";
}>;
export declare const listBookingsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: string | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
//# sourceMappingURL=bookings.schema.d.ts.map