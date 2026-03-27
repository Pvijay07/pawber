"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsService = exports.ReviewsService = void 0;
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('ReviewsService');
class ReviewsService {
    async getByProvider(providerId, limit, offset) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('reviews')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        // Get average
        const { data: stats } = await lib_1.supabaseAdmin
            .from('reviews')
            .select('rating')
            .eq('provider_id', providerId);
        const avgRating = stats && stats.length > 0
            ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length
            : 0;
        return (0, types_1.ok)({
            reviews: data,
            stats: {
                average_rating: Math.round(avgRating * 10) / 10,
                total_reviews: stats?.length || 0,
            },
        });
    }
    async create(userId, input) {
        const { booking_id, rating, comment } = input;
        // Verify booking
        const { data: booking } = await lib_1.supabaseAdmin
            .from('bookings')
            .select('id, provider_id, status')
            .eq('id', booking_id)
            .eq('user_id', userId)
            .single();
        if (!booking)
            return (0, types_1.fail)('Booking not found', 404);
        if (booking.status !== 'completed')
            return (0, types_1.fail)('Can only review completed bookings', 400);
        if (!booking.provider_id)
            return (0, types_1.fail)('No provider assigned to this booking', 400);
        // Check if already reviewed
        const { data: existingReview } = await lib_1.supabaseAdmin
            .from('reviews')
            .select('id')
            .eq('booking_id', booking_id)
            .single();
        if (existingReview)
            return (0, types_1.fail)('You have already reviewed this booking', 409);
        const { data, error } = await lib_1.supabaseAdmin
            .from('reviews')
            .insert({
            booking_id,
            user_id: userId,
            provider_id: booking.provider_id,
            rating,
            comment,
        })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        log.info('Review created', { userId, providerId: booking.provider_id, rating });
        return (0, types_1.ok)({ review: data });
    }
    async reply(userId, reviewId, input) {
        const { reply } = input;
        // Verify provider ownership
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!provider)
            return (0, types_1.fail)('Provider not found', 404);
        const { data, error } = await lib_1.supabaseAdmin
            .from('reviews')
            .update({ reply, reply_at: new Date().toISOString() })
            .eq('id', reviewId)
            .eq('provider_id', provider.id)
            .select()
            .single();
        if (error || !data)
            return (0, types_1.fail)('Review not found or access denied', 404);
        return (0, types_1.ok)({ review: data });
    }
}
exports.ReviewsService = ReviewsService;
exports.reviewsService = new ReviewsService();
//# sourceMappingURL=reviews.service.js.map