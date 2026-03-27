"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
exports.trackingRouter = (0, express_1.Router)();
exports.trackingRouter.use(auth_middleware_1.authenticate);
// ─── Update Provider Location ───────────────────
const updateLocationSchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    accuracy: zod_1.z.number().optional(),
    heading: zod_1.z.number().optional(),
    speed: zod_1.z.number().optional(),
    status: zod_1.z.string().optional(), // 'on_the_way', 'arrived', 'in_progress', 'returning'
});
exports.trackingRouter.post('/update', (0, validate_middleware_1.validate)(updateLocationSchema), async (req, res, next) => {
    try {
        const { booking_id, latitude, longitude, accuracy, heading, speed, status } = req.body;
        // Verify the provider owns this booking
        const { data: booking } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('id, provider_id, providers:provider_id ( user_id )')
            .eq('id', booking_id)
            .single();
        if (!booking)
            return res.status(404).json({ error: 'Booking not found' });
        const providerUserId = booking.providers?.user_id;
        if (providerUserId !== req.user.id) {
            return res.status(403).json({ error: 'Only assigned provider can update location' });
        }
        // Insert location point
        const { data, error } = await supabase_1.supabaseAdmin
            .from('location_updates')
            .insert({
            booking_id,
            provider_id: booking.provider_id,
            latitude,
            longitude,
            accuracy: accuracy || null,
            heading: heading || null,
            speed: speed || null,
            status: status || 'in_progress',
        })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ location: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Latest Location for a Booking ──────────
exports.trackingRouter.get('/booking/:bookingId', async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        // Latest location
        const { data: latest } = await supabase_1.supabaseAdmin
            .from('location_updates')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        // Full path for the session
        const { data: path } = await supabase_1.supabaseAdmin
            .from('location_updates')
            .select('latitude, longitude, created_at, status')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });
        res.json({
            latest: latest || null,
            path: path || [],
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Booking Info with Provider Details ─────
exports.trackingRouter.get('/booking/:bookingId/info', async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const { data: booking } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
                id, status, booking_type, booking_date, total_amount, created_at,
                service:services ( name, description ),
                package:service_packages ( package_name, duration_minutes ),
                provider:providers (
                    id, business_name, rating, total_reviews,
                    user:profiles ( full_name, avatar_url, phone )
                ),
                booking_pets ( pet:pets ( name, type, image_url ) )
            `)
            .eq('id', bookingId)
            .single();
        if (!booking)
            return res.status(404).json({ error: 'Booking not found' });
        res.json({ booking });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=tracking.routes.js.map