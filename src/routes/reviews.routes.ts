import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';

export const reviewsRouter = Router();

// ─── Get Reviews for Provider (Public) ──────────
reviewsRouter.get('/provider/:providerId', async (req, res, next) => {
    try {
        const { limit = '20', offset = '0' } = req.query;

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('provider_id', req.params.providerId)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (error) return res.status(500).json({ error: error.message });

        // Get average
        const { data: stats } = await supabaseAdmin
            .from('reviews')
            .select('rating')
            .eq('provider_id', req.params.providerId);

        const avgRating = stats && stats.length > 0
            ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length
            : 0;

        res.json({
            reviews: data,
            stats: {
                average_rating: Math.round(avgRating * 10) / 10,
                total_reviews: stats?.length || 0,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── Create Review ──────────────────────────────
const createReviewSchema = z.object({
    booking_id: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

reviewsRouter.post('/', authenticate, validate(createReviewSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { booking_id, rating, comment } = req.body;

        // Verify booking exists, is completed, and belongs to user
        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select('id, provider_id, status')
            .eq('id', booking_id)
            .eq('user_id', req.user!.id)
            .single();

        if (!booking) throw new AppError('Booking not found', 404);
        if (booking.status !== 'completed') throw new AppError('Can only review completed bookings', 400);
        if (!booking.provider_id) throw new AppError('No provider assigned to this booking', 400);

        // Check if already reviewed
        const { data: existingReview } = await supabaseAdmin
            .from('reviews')
            .select('id')
            .eq('booking_id', booking_id)
            .single();

        if (existingReview) throw new AppError('You have already reviewed this booking', 409);

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert({
                booking_id,
                user_id: req.user!.id,
                provider_id: booking.provider_id,
                rating,
                comment,
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create review', 500);

        // Provider rating auto-updates via trigger
        res.status(201).json({ review: data });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Reply to Review ──────────────────
reviewsRouter.patch('/:id/reply', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { reply } = req.body;
        if (!reply) throw new AppError('Reply text is required', 400);

        // Verify provider owns this review
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) throw new AppError('Provider not found', 404);

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .update({ reply, reply_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('provider_id', provider.id)
            .select()
            .single();

        if (error || !data) throw new AppError('Review not found or access denied', 404);
        res.json({ review: data });
    } catch (err) {
        next(err);
    }
});
