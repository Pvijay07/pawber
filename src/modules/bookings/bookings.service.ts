import { ServiceResult, ok, fail } from '../../shared/types';
import { CreateBookingInput, CancelBookingInput, ListBookingsQuery } from './bookings.schema';
import { loyaltyService } from '../loyalty/loyalty.service';
import { supabaseAdmin, createLogger } from '../../shared/lib';

const log = createLogger('BookingsService');

/**
 * Bookings Service — contains ALL business logic for bookings.
 * No HTTP concepts (req, res) allowed here. Pure data in → data out.
 */
export class BookingsService {

    /**
     * Create a new booking with full price calculation, slot locking, and coupon application.
     */
    async create(userId: string, input: CreateBookingInput): Promise<ServiceResult<any>> {
        const {
            service_id, package_id, booking_type, booking_date,
            slot_id, pet_ids, addon_ids, address, latitude, longitude,
            notes, coupon_code, points_to_use
        } = input;

        // 1. Verify package exists & get price
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('service_packages')
            .select('price, is_instant_available, is_scheduled_available')
            .eq('id', package_id)
            .single();

        if (pkgError || !pkg) return fail('Package not found', 404);

        // Check booking type availability
        if (booking_type === 'instant' && !pkg.is_instant_available) {
            return fail('Instant booking not available for this package', 400);
        }
        if (booking_type === 'scheduled' && !pkg.is_scheduled_available) {
            return fail('Scheduled booking not available for this package', 400);
        }

        // 2. Calculate total
        let total = pkg.price * pet_ids.length;

        // Add addon prices
        let addonPrices: { addon_id: string; price: number }[] = [];
        if (addon_ids.length > 0) {
            const { data: addons } = await supabaseAdmin
                .from('addons')
                .select('id, price')
                .in('id', addon_ids);

            if (addons) {
                addons.forEach((addon: any) => {
                    total += addon.price * pet_ids.length;
                    addonPrices.push({ addon_id: addon.id, price: addon.price });
                });
            }
        }

        // Instant surcharge (15%)
        if (booking_type === 'instant') {
            total = total * 1.15;
        }

        // 3. Apply coupon
        let couponDiscount = 0;
        if (coupon_code) {
            couponDiscount = await this.applyCoupon(coupon_code, total);
            total -= couponDiscount;
        }

        // 3a. Apply Loyalty Reward (Max ₹1500 off)
        let isLoyaltyReward = false;
        const loyaltyCheck = await loyaltyService.checkLoyaltyEligibility(userId);
        if (loyaltyCheck.isEligible) {
            const rewardAmt = Math.min(total, 1500);
            total -= rewardAmt;
            isLoyaltyReward = true;
            log.info('Loyalty reward applied', { userId, rewardAmt });
        }

        // 3b. Apply Points Redemption (₹1 per Point)
        let pointsRedeemed = 0;
        if (points_to_use && points_to_use > 0) {
            const { data: wallet } = await supabaseAdmin.from('wallets').select('points_balance').eq('user_id', userId).single();
            const availablePoints = wallet?.points_balance || 0;
            pointsRedeemed = Math.min(points_to_use, availablePoints, total);
            total -= pointsRedeemed;
            if (pointsRedeemed > 0) {
                await loyaltyService.debitPoints(userId, pointsRedeemed);
            }
        }

        total = Math.max(0, Math.round(total * 100) / 100);

        // 4. Lock slot if scheduled
        if (booking_type === 'scheduled' && slot_id) {
            const slotResult = await this.lockSlot(slot_id, userId);
            if (!slotResult.success) return slotResult;
        }

        // 5. Create booking record
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                user_id: userId,
                service_id,
                package_id,
                booking_type,
                booking_date: booking_date || new Date().toISOString().split('T')[0],
                slot_id,
                total_amount: total,
                address,
                latitude,
                longitude,
                notes,
                status: booking_type === 'instant' ? 'confirmed' : 'pending',
                is_loyalty_reward: isLoyaltyReward,
                points_used: pointsRedeemed
            })
            .select()
            .single();

        if (bookingError) {
            log.error('Failed to create booking', { error: bookingError });
            return fail('Failed to create booking', 500);
        }

        // 6. Link pets
        const petLinks = pet_ids.map((pet_id: string) => ({
            booking_id: booking.id,
            pet_id,
        }));
        await supabaseAdmin.from('booking_pets').insert(petLinks);

        // 7. Link addons
        if (addonPrices.length > 0) {
            const addonLinks = addonPrices.map(a => ({
                booking_id: booking.id,
                addon_id: a.addon_id,
                price: a.price,
            }));
            await supabaseAdmin.from('booking_addons').insert(addonLinks);
        }

        // 8. Increment slot booking count
        if (slot_id) {
            await supabaseAdmin.rpc('increment_slot_booking', { p_slot_id: slot_id });
        }

        // 9. Notification
        await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title: 'Booking Created!',
            message: `Your ${booking_type} booking has been created. Total: ₹${total}`,
            type: 'booking',
            data: { booking_id: booking.id },
        });

        log.info('Booking created', { bookingId: booking.id, userId, total });

        return ok({
            booking: {
                ...booking,
                pet_ids,
                addon_ids,
                coupon_discount: couponDiscount,
            },
        }, 201);
    }

    /**
     * List bookings for a user with optional status filter.
     */
    async listByUser(userId: string, query: ListBookingsQuery): Promise<ServiceResult<any>> {
        const { status, limit, offset } = query;

        let dbQuery = supabaseAdmin
            .from('bookings')
            .select(`
                *,
                service:services(name, description),
                package:service_packages(package_name, price, duration_minutes),
                provider:providers(business_name, rating),
                booking_pets(pet:pets(id, name, image_url)),
                booking_addons(addon:addons(id, name), price)
            `)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            dbQuery = dbQuery.eq('status', status);
        }

        const { data, error } = await dbQuery;
        if (error) return fail(error.message, 500);

        return ok({ bookings: data });
    }

    /**
     * Get booking details by ID (scoped to user).
     */
    async getById(userId: string, bookingId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                service:services(name, description, image_url),
                package:service_packages(package_name, price, duration_minutes, features),
                provider:providers(business_name, rating, address, user:profiles(full_name, phone, avatar_url)),
                booking_pets(pet:pets(id, name, type, breed, image_url)),
                booking_addons(addon:addons(id, name, duration_minutes), price)
            `)
            .eq('id', bookingId)
            .eq('user_id', userId)
            .single();

        if (error || !data) return fail('Booking not found', 404);
        return ok({ booking: data });
    }

    /**
     * Cancel a booking with refund processing.
     */
    async cancel(userId: string, bookingId: string, input: CancelBookingInput): Promise<ServiceResult<any>> {
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('id, status, slot_id, total_amount, user_id, payment_status')
            .eq('id', bookingId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !booking) return fail('Booking not found', 404);

        if (!['pending', 'confirmed'].includes(booking.status)) {
            return fail('Cannot cancel a booking that is already in progress or completed', 400);
        }

        // Cancel the booking
        const { data, error } = await supabaseAdmin
            .from('bookings')
            .update({
                status: 'cancelled',
                cancelled_by: userId,
                cancelled_reason: input.reason || 'User cancelled',
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (error) return fail('Failed to cancel booking', 500);

        // Release slot
        if (booking.slot_id) {
            await this.releaseSlot(booking.slot_id, userId);
        }

        // Process refund
        if (booking.payment_status === 'paid' || booking.payment_status === 'escrow') {
            await this.processRefund(userId, booking.id, booking.total_amount);
        }

        log.info('Booking cancelled', { bookingId, userId });
        return ok({ booking: data, message: 'Booking cancelled successfully' });
    }

    /**
     * Provider/Admin: update booking status.
     */
    async updateStatus(bookingId: string, status: string): Promise<ServiceResult<any>> {
        const updateData: any = { status };
        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select()
            .single();

        if (error || !data) return fail('Booking not found', 404);

        // --- Loyalty & Referral Processing on Completion ---
        if (status === 'completed' && data.total_amount > 0) {
            // 1. Calculate and credit points (5 per 100)
            const pointsToEarn = await loyaltyService.calculatePointsToEarn(data.total_amount);
            if (pointsToEarn > 0) {
                await loyaltyService.creditPoints(data.user_id, pointsToEarn, 'booking_reward', bookingId);
                await supabaseAdmin.from('bookings').update({ points_earned: pointsToEarn }).eq('id', bookingId);
            }

            // 2. Process Referral Reward (if first booking)
            const { count } = await supabaseAdmin
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', data.user_id)
                .eq('status', 'completed');

            if (count === 1) {
                await loyaltyService.processReferralReward(data.user_id);
            }
        }

        // Notify user
        await supabaseAdmin.from('notifications').insert({
            user_id: data.user_id,
            title: `Booking ${status.replace('_', ' ')}`,
            message: `Your booking has been ${status.replace('_', ' ')}.`,
            type: 'booking',
            data: { booking_id: data.id },
        });

        return ok({ booking: data });
    }

    // ─── Private Helpers ────────────────────────────

    private async applyCoupon(couponCode: string, total: number): Promise<number> {
        const { data: coupon } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', couponCode.toUpperCase())
            .eq('is_active', true)
            .single();

        if (!coupon) return 0;

        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (validFrom && now < validFrom) return 0;
        if (validUntil && now > validUntil) return 0;
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return 0;
        if (total < (coupon.min_order_amount || 0)) return 0;

        let discount = 0;
        if (coupon.discount_type === 'percent') {
            discount = total * (coupon.discount_value / 100);
            if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
            }
        } else {
            discount = coupon.discount_value;
        }

        return discount;
    }

    private async lockSlot(slotId: string, userId: string): Promise<ServiceResult<void>> {
        const { data: slot } = await supabaseAdmin
            .from('provider_slots')
            .select('capacity, booked_count, is_blocked')
            .eq('id', slotId)
            .single();

        if (!slot || slot.is_blocked || slot.booked_count >= slot.capacity) {
            return fail('Selected slot is no longer available', 409);
        }

        const lockExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const { error: lockError } = await supabaseAdmin
            .from('slot_locks')
            .insert({ slot_id: slotId, user_id: userId, lock_expires_at: lockExpiry });

        if (lockError) {
            return fail('Failed to lock slot. Someone else may be booking it.', 409);
        }

        return ok(undefined);
    }

    private async releaseSlot(slotId: string, userId: string): Promise<void> {
        await supabaseAdmin.rpc('decrement_slot_booking', { p_slot_id: slotId });

        await supabaseAdmin
            .from('slot_locks')
            .delete()
            .eq('slot_id', slotId)
            .eq('user_id', userId);
    }

    private async processRefund(userId: string, bookingId: string, amount: number): Promise<void> {
        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (wallet) {
            await supabaseAdmin.from('wallet_transactions').insert({
                wallet_id: wallet.id,
                type: 'refund',
                amount,
                description: 'Refund for cancelled booking',
                reference_id: bookingId,
                reference_type: 'booking',
            });

            await supabaseAdmin.rpc('increment_wallet_balance', {
                p_wallet_id: wallet.id,
                p_amount: amount,
            });
        }
    }
}

export const bookingsService = new BookingsService();
