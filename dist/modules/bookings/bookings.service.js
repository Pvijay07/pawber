"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsService = exports.BookingsService = void 0;
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('BookingsService');
/**
 * Bookings Service — contains ALL business logic for bookings.
 * No HTTP concepts (req, res) allowed here. Pure data in → data out.
 */
class BookingsService {
    /**
     * Create a new booking with full price calculation, slot locking, and coupon application.
     */
    async create(userId, input) {
        const { service_id, package_id, booking_type, booking_date, slot_id, pet_ids, addon_ids, address, latitude, longitude, notes, coupon_code } = input;
        // 1. Verify package exists & get price
        const { data: pkg, error: pkgError } = await lib_1.supabaseAdmin
            .from('service_packages')
            .select('price, is_instant_available, is_scheduled_available')
            .eq('id', package_id)
            .single();
        if (pkgError || !pkg)
            return (0, types_1.fail)('Package not found', 404);
        // Check booking type availability
        if (booking_type === 'instant' && !pkg.is_instant_available) {
            return (0, types_1.fail)('Instant booking not available for this package', 400);
        }
        if (booking_type === 'scheduled' && !pkg.is_scheduled_available) {
            return (0, types_1.fail)('Scheduled booking not available for this package', 400);
        }
        // 2. Calculate total
        let total = pkg.price * pet_ids.length;
        // Add addon prices
        let addonPrices = [];
        if (addon_ids.length > 0) {
            const { data: addons } = await lib_1.supabaseAdmin
                .from('addons')
                .select('id, price')
                .in('id', addon_ids);
            if (addons) {
                addons.forEach((addon) => {
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
        total = Math.round(total * 100) / 100;
        // 4. Lock slot if scheduled
        if (booking_type === 'scheduled' && slot_id) {
            const slotResult = await this.lockSlot(slot_id, userId);
            if (!slotResult.success)
                return slotResult;
        }
        // 5. Create booking record
        const { data: booking, error: bookingError } = await lib_1.supabaseAdmin
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
        })
            .select()
            .single();
        if (bookingError) {
            log.error('Failed to create booking', { error: bookingError });
            return (0, types_1.fail)('Failed to create booking', 500);
        }
        // 6. Link pets
        const petLinks = pet_ids.map((pet_id) => ({
            booking_id: booking.id,
            pet_id,
        }));
        await lib_1.supabaseAdmin.from('booking_pets').insert(petLinks);
        // 7. Link addons
        if (addonPrices.length > 0) {
            const addonLinks = addonPrices.map(a => ({
                booking_id: booking.id,
                addon_id: a.addon_id,
                price: a.price,
            }));
            await lib_1.supabaseAdmin.from('booking_addons').insert(addonLinks);
        }
        // 8. Increment slot booking count
        if (slot_id) {
            await lib_1.supabaseAdmin.rpc('increment_slot_booking', { p_slot_id: slot_id });
        }
        // 9. Notification
        await lib_1.supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title: 'Booking Created!',
            message: `Your ${booking_type} booking has been created. Total: ₹${total}`,
            type: 'booking',
            data: { booking_id: booking.id },
        });
        log.info('Booking created', { bookingId: booking.id, userId, total });
        return (0, types_1.ok)({
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
    async listByUser(userId, query) {
        const { status, limit, offset } = query;
        let dbQuery = lib_1.supabaseAdmin
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
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ bookings: data });
    }
    /**
     * Get booking details by ID (scoped to user).
     */
    async getById(userId, bookingId) {
        const { data, error } = await lib_1.supabaseAdmin
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
        if (error || !data)
            return (0, types_1.fail)('Booking not found', 404);
        return (0, types_1.ok)({ booking: data });
    }
    /**
     * Cancel a booking with refund processing.
     */
    async cancel(userId, bookingId, input) {
        const { data: booking, error: fetchError } = await lib_1.supabaseAdmin
            .from('bookings')
            .select('id, status, slot_id, total_amount, user_id, payment_status')
            .eq('id', bookingId)
            .eq('user_id', userId)
            .single();
        if (fetchError || !booking)
            return (0, types_1.fail)('Booking not found', 404);
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return (0, types_1.fail)('Cannot cancel a booking that is already in progress or completed', 400);
        }
        // Cancel the booking
        const { data, error } = await lib_1.supabaseAdmin
            .from('bookings')
            .update({
            status: 'cancelled',
            cancelled_by: userId,
            cancelled_reason: input.reason || 'User cancelled',
        })
            .eq('id', bookingId)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)('Failed to cancel booking', 500);
        // Release slot
        if (booking.slot_id) {
            await this.releaseSlot(booking.slot_id, userId);
        }
        // Process refund
        if (booking.payment_status === 'paid' || booking.payment_status === 'escrow') {
            await this.processRefund(userId, booking.id, booking.total_amount);
        }
        log.info('Booking cancelled', { bookingId, userId });
        return (0, types_1.ok)({ booking: data, message: 'Booking cancelled successfully' });
    }
    /**
     * Provider/Admin: update booking status.
     */
    async updateStatus(bookingId, status) {
        const updateData = { status };
        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }
        const { data, error } = await lib_1.supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select()
            .single();
        if (error || !data)
            return (0, types_1.fail)('Booking not found', 404);
        // Notify user
        await lib_1.supabaseAdmin.from('notifications').insert({
            user_id: data.user_id,
            title: `Booking ${status.replace('_', ' ')}`,
            message: `Your booking has been ${status.replace('_', ' ')}.`,
            type: 'booking',
            data: { booking_id: data.id },
        });
        return (0, types_1.ok)({ booking: data });
    }
    // ─── Private Helpers ────────────────────────────
    async applyCoupon(couponCode, total) {
        const { data: coupon } = await lib_1.supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', couponCode.toUpperCase())
            .eq('is_active', true)
            .single();
        if (!coupon)
            return 0;
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        if (validFrom && now < validFrom)
            return 0;
        if (validUntil && now > validUntil)
            return 0;
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
            return 0;
        if (total < (coupon.min_order_amount || 0))
            return 0;
        let discount = 0;
        if (coupon.discount_type === 'percent') {
            discount = total * (coupon.discount_value / 100);
            if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
            }
        }
        else {
            discount = coupon.discount_value;
        }
        return discount;
    }
    async lockSlot(slotId, userId) {
        const { data: slot } = await lib_1.supabaseAdmin
            .from('provider_slots')
            .select('capacity, booked_count, is_blocked')
            .eq('id', slotId)
            .single();
        if (!slot || slot.is_blocked || slot.booked_count >= slot.capacity) {
            return (0, types_1.fail)('Selected slot is no longer available', 409);
        }
        const lockExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const { error: lockError } = await lib_1.supabaseAdmin
            .from('slot_locks')
            .insert({ slot_id: slotId, user_id: userId, lock_expires_at: lockExpiry });
        if (lockError) {
            return (0, types_1.fail)('Failed to lock slot. Someone else may be booking it.', 409);
        }
        return (0, types_1.ok)(undefined);
    }
    async releaseSlot(slotId, userId) {
        await lib_1.supabaseAdmin.rpc('decrement_slot_booking', { p_slot_id: slotId });
        await lib_1.supabaseAdmin
            .from('slot_locks')
            .delete()
            .eq('slot_id', slotId)
            .eq('user_id', userId);
    }
    async processRefund(userId, bookingId, amount) {
        const { data: wallet } = await lib_1.supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (wallet) {
            await lib_1.supabaseAdmin.from('wallet_transactions').insert({
                wallet_id: wallet.id,
                type: 'refund',
                amount,
                description: 'Refund for cancelled booking',
                reference_id: bookingId,
                reference_type: 'booking',
            });
            await lib_1.supabaseAdmin.rpc('increment_wallet_balance', {
                p_wallet_id: wallet.id,
                p_amount: amount,
            });
        }
    }
}
exports.BookingsService = BookingsService;
exports.bookingsService = new BookingsService();
//# sourceMappingURL=bookings.service.js.map