import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { CreateReviewInput, ReplyReviewInput } from './reviews.schema';

const log = createLogger('ReviewsService');

export class ReviewsService {

    async getByProvider(providerId: string, limit: number, offset: number): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('reviews')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return fail(error.message, 500);

        // Get average
        const { data: stats } = await supabaseAdmin
            .from('reviews')
            .select('rating')
            .eq('provider_id', providerId);

        const avgRating = stats && stats.length > 0
            ? stats.reduce((sum: number, r: any) => sum + r.rating, 0) / stats.length
            : 0;

        return ok({
            reviews: data,
            stats: {
                average_rating: Math.round(avgRating * 10) / 10,
                total_reviews: stats?.length || 0,
            },
        });
    }

    async create(userId: string, input: CreateReviewInput): Promise<ServiceResult<any>> {
        const { booking_id, rating, comment } = input;

        // Verify booking
        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select('id, provider_id, status')
            .eq('id', booking_id)
            .eq('user_id', userId)
            .single();

        if (!booking) return fail('Booking not found', 404);
        if (booking.status !== 'completed') return fail('Can only review completed bookings', 400);
        if (!booking.provider_id) return fail('No provider assigned to this booking', 400);

        // Check if already reviewed
        const { data: existingReview } = await supabaseAdmin
            .from('reviews')
            .select('id')
            .eq('booking_id', booking_id)
            .single();

        if (existingReview) return fail('You have already reviewed this booking', 409);

        const { data, error } = await supabaseAdmin
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

        if (error) return fail(error.message, 500);

        log.info('Review created', { userId, providerId: booking.provider_id, rating });
        return ok({ review: data });
    }

    async reply(userId: string, reviewId: string, input: ReplyReviewInput): Promise<ServiceResult<any>> {
        const { reply } = input;

        // Verify provider ownership
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!provider) return fail('Provider not found', 404);

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .update({ reply, reply_at: new Date().toISOString() })
            .eq('id', reviewId)
            .eq('provider_id', provider.id)
            .select()
            .single();

        if (error || !data) return fail('Review not found or access denied', 404);
        return ok({ review: data });
    }
}

export const reviewsService = new ReviewsService();
