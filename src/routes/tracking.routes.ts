import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const trackingRouter = Router();
trackingRouter.use(authenticate);

// ─── Update Provider Location ───────────────────
const updateLocationSchema = z.object({
    booking_id: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
    heading: z.number().optional(),
    speed: z.number().optional(),
    status: z.string().optional(), // 'on_the_way', 'arrived', 'in_progress', 'returning'
});

trackingRouter.post('/update', validate(updateLocationSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { booking_id, latitude, longitude, accuracy, heading, speed, status } = req.body;

        // Verify the provider owns this booking
        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select('id, provider_id, providers:provider_id ( user_id )')
            .eq('id', booking_id)
            .single();

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const providerUserId = (booking as any).providers?.user_id;
        if (providerUserId !== req.user!.id) {
            return res.status(403).json({ error: 'Only assigned provider can update location' });
        }

        // Insert location point
        const { data, error } = await supabaseAdmin
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

        if (error) return res.status(500).json({ error: error.message });

        // Mark tracking as started
        await supabaseAdmin
            .from('bookings')
            .update({ tracking_started: true })
            .eq('id', booking_id)
            .eq('tracking_started', false);

        res.json({ location: data });
    } catch (err) {
        next(err);
    }
});

// ─── Get Latest Location for a Booking ──────────
trackingRouter.get('/booking/:bookingId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { bookingId } = req.params;

        // Latest location
        const { data: latest } = await supabaseAdmin
            .from('location_updates')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Full path for the session
        const { data: path } = await supabaseAdmin
            .from('location_updates')
            .select('latitude, longitude, created_at, status')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

        res.json({
            latest: latest || null,
            path: path || [],
        });
    } catch (err) {
        next(err);
    }
});

// ─── Get Booking Info with Provider Details ─────
trackingRouter.get('/booking/:bookingId/info', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { bookingId } = req.params;

        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select(`
                id, status, booking_type, booking_date, total_amount, tracking_started, tracking_missed, created_at,
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

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        res.json({ booking });
    } catch (err) {
        next(err);
    }
});
