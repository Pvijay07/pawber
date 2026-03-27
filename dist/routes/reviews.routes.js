"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
exports.reviewsRouter = (0, express_1.Router)();
// ─── Get Reviews for Provider (Public) ──────────
exports.reviewsRouter.get('/provider/:providerId', async (req, res, next) => {
    try {
        const { limit = '20', offset = '0' } = req.query;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('reviews')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('provider_id', req.params.providerId)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (error)
            return res.status(500).json({ error: error.message });
        // Get average
        const { data: stats } = await supabase_1.supabaseAdmin
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
    }
    catch (err) {
        next(err);
    }
});
// ─── Create Review ──────────────────────────────
const createReviewSchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().optional(),
});
exports.reviewsRouter.post('/', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(createReviewSchema), async (req, res, next) => {
    try {
        const { booking_id, rating, comment } = req.body;
        // Verify booking exists, is completed, and belongs to user
        const { data: booking } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('id, provider_id, status')
            .eq('id', booking_id)
            .eq('user_id', req.user.id)
            .single();
        if (!booking)
            throw new error_middleware_1.AppError('Booking not found', 404);
        if (booking.status !== 'completed')
            throw new error_middleware_1.AppError('Can only review completed bookings', 400);
        if (!booking.provider_id)
            throw new error_middleware_1.AppError('No provider assigned to this booking', 400);
        // Check if already reviewed
        const { data: existingReview } = await supabase_1.supabaseAdmin
            .from('reviews')
            .select('id')
            .eq('booking_id', booking_id)
            .single();
        if (existingReview)
            throw new error_middleware_1.AppError('You have already reviewed this booking', 409);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('reviews')
            .insert({
            booking_id,
            user_id: req.user.id,
            provider_id: booking.provider_id,
            rating,
            comment,
        })
            .select()
            .single();
        if (error)
            throw new error_middleware_1.AppError('Failed to create review', 500);
        // Provider rating auto-updates via trigger
        res.status(201).json({ review: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Provider: Reply to Review ──────────────────
exports.reviewsRouter.patch('/:id/reply', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const { reply } = req.body;
        if (!reply)
            throw new error_middleware_1.AppError('Reply text is required', 400);
        // Verify provider owns this review
        const { data: provider } = await supabase_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (!provider)
            throw new error_middleware_1.AppError('Provider not found', 404);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('reviews')
            .update({ reply, reply_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('provider_id', provider.id)
            .select()
            .single();
        if (error || !data)
            throw new error_middleware_1.AppError('Review not found or access denied', 404);
        res.json({ review: data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=reviews.routes.js.map