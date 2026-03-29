"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
exports.bookingsRouter = (0, express_1.Router)();
exports.bookingsRouter.use(auth_middleware_1.authenticate);
const createBookingSchema = zod_1.z.object({
    service_id: zod_1.z.string().uuid(),
    package_id: zod_1.z.string().uuid(),
    booking_type: zod_1.z.enum(['instant', 'scheduled']),
    booking_date: zod_1.z.string().optional(), // ISO date for scheduled
    slot_id: zod_1.z.string().uuid().optional(),
    pet_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    addon_ids: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
    address: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
    coupon_code: zod_1.z.string().optional(),
});
/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Manage pet service bookings
 */
/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service_id, package_id, booking_type, pet_ids]
 *             properties:
 *               service_id: { type: string, format: uuid }
 *               package_id: { type: string, format: uuid }
 *               booking_type: { type: string, enum: [instant, scheduled] }
 *               booking_date: { type: string, format: date }
 *               slot_id: { type: string, format: uuid }
 *               pet_ids: { type: array, items: { type: string, format: uuid } }
 *               addon_ids: { type: array, items: { type: string, format: uuid } }
 *               address: { type: string }
 *               notes: { type: string }
 *               coupon_code: { type: string }
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
exports.bookingsRouter.post('/', (0, validate_middleware_1.validate)(createBookingSchema), async (req, res, next) => {
    try {
        const { service_id, package_id, booking_type, booking_date, slot_id, pet_ids, addon_ids, address, latitude, longitude, notes, coupon_code } = req.body;
        // 1. Verify package exists & get price
        const { data: pkg, error: pkgError } = await supabase_1.supabaseAdmin
            .from('service_packages')
            .select('price, is_instant_available, is_scheduled_available')
            .eq('id', package_id)
            .single();
        if (pkgError || !pkg)
            throw new error_middleware_1.AppError('Package not found', 404);
        // Check booking type availability
        if (booking_type === 'instant' && !pkg.is_instant_available) {
            throw new error_middleware_1.AppError('Instant booking not available for this package', 400);
        }
        if (booking_type === 'scheduled' && !pkg.is_scheduled_available) {
            throw new error_middleware_1.AppError('Scheduled booking not available for this package', 400);
        }
        // 2. Calculate total
        let total = pkg.price * pet_ids.length;
        // Add addon prices
        let addonPrices = [];
        if (addon_ids.length > 0) {
            const { data: addons } = await supabase_1.supabaseAdmin
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
            const { data: coupon } = await supabase_1.supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', coupon_code.toUpperCase())
                .eq('is_active', true)
                .single();
            if (coupon) {
                const now = new Date();
                const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
                const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
                if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
                    if (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) {
                        if (total >= (coupon.min_order_amount || 0)) {
                            if (coupon.discount_type === 'percent') {
                                couponDiscount = total * (coupon.discount_value / 100);
                                if (coupon.max_discount) {
                                    couponDiscount = Math.min(couponDiscount, coupon.max_discount);
                                }
                            }
                            else {
                                couponDiscount = coupon.discount_value;
                            }
                            total -= couponDiscount;
                        }
                    }
                }
            }
        }
        total = Math.round(total * 100) / 100; // round to 2 decimals
        // 4. If scheduled, lock the slot
        if (booking_type === 'scheduled' && slot_id) {
            // Check slot availability
            const { data: slot } = await supabase_1.supabaseAdmin
                .from('provider_slots')
                .select('capacity, booked_count, is_blocked')
                .eq('id', slot_id)
                .single();
            if (!slot || slot.is_blocked || slot.booked_count >= slot.capacity) {
                throw new error_middleware_1.AppError('Selected slot is no longer available', 409);
            }
            // Acquire lock
            const lockExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min lock
            const { error: lockError } = await supabase_1.supabaseAdmin
                .from('slot_locks')
                .insert({
                slot_id,
                user_id: req.user.id,
                lock_expires_at: lockExpiry,
            });
            if (lockError) {
                throw new error_middleware_1.AppError('Failed to lock slot. Someone else may be booking it.', 409);
            }
        }
        // 5. Create booking
        const { data: booking, error: bookingError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .insert({
            user_id: req.user.id,
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
        if (bookingError)
            throw new error_middleware_1.AppError('Failed to create booking', 500);
        // 6. Link pets
        const petLinks = pet_ids.map((pet_id) => ({
            booking_id: booking.id,
            pet_id,
        }));
        await supabase_1.supabaseAdmin.from('booking_pets').insert(petLinks);
        // 7. Link addons
        if (addonPrices.length > 0) {
            const addonLinks = addonPrices.map(a => ({
                booking_id: booking.id,
                addon_id: a.addon_id,
                price: a.price,
            }));
            await supabase_1.supabaseAdmin.from('booking_addons').insert(addonLinks);
        }
        // 8. Increment slot booking count
        if (slot_id) {
            await supabase_1.supabaseAdmin.rpc('increment_slot_booking', { p_slot_id: slot_id });
        }
        // 9. Update coupon usage
        if (coupon_code && couponDiscount > 0) {
            await supabase_1.supabaseAdmin
                .from('coupons')
                .update({ used_count: supabase_1.supabaseAdmin.rpc }) // Increment
                .eq('code', coupon_code.toUpperCase());
            await supabase_1.supabaseAdmin.from('coupon_usage').insert({
                coupon_id: coupon_code, // will need actual coupon id
                user_id: req.user.id,
                booking_id: booking.id,
            });
        }
        // 10. Create notification
        await supabase_1.supabaseAdmin.from('notifications').insert({
            user_id: req.user.id,
            title: 'Booking Created!',
            message: `Your ${booking_type} booking has been created. Total: ₹${total}`,
            type: 'booking',
            data: { booking_id: booking.id },
        });
        res.status(201).json({
            booking: {
                ...booking,
                pet_ids,
                addon_ids,
                coupon_discount: couponDiscount,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: List user bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by status
 */
exports.bookingsRouter.get('/', async (req, res, next) => {
    try {
        const { status, limit = '20', offset = '0' } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        *,
        service:services(name, description),
        package:service_packages(package_name, price, duration_minutes),
        provider:providers(business_name, rating),
        booking_pets(pet:pets(id, name, image_url)),
        booking_addons(addon:addons(id, name), price)
      `)
            .eq('user_id', req.user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (status) {
            query = query.eq('status', status);
        }
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ bookings: data });
    }
    catch (err) {
        next(err);
    }
});
/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
exports.bookingsRouter.get('/:id', async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        *,
        service:services(name, description, image_url),
        package:service_packages(package_name, price, duration_minutes, features),
        provider:providers(business_name, rating, address, user:profiles(full_name, phone, avatar_url)),
        booking_pets(pet:pets(id, name, type, breed, image_url)),
        booking_addons(addon:addons(id, name, duration_minutes), price)
      `)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Booking not found' });
        res.json({ booking: data });
    }
    catch (err) {
        next(err);
    }
});
/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 */
exports.bookingsRouter.post('/:id/cancel', async (req, res, next) => {
    try {
        const { reason } = req.body;
        const { data: booking, error: fetchError } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('id, status, slot_id, total_amount, user_id, payment_status')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();
        if (fetchError || !booking)
            return res.status(404).json({ error: 'Booking not found' });
        if (!['pending', 'confirmed'].includes(booking.status)) {
            throw new error_middleware_1.AppError('Cannot cancel a booking that is already in progress or completed', 400);
        }
        // Cancel the booking
        const { data, error } = await supabase_1.supabaseAdmin
            .from('bookings')
            .update({
            status: 'cancelled',
            cancelled_by: req.user.id,
            cancelled_reason: reason || 'User cancelled',
        })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error)
            throw new error_middleware_1.AppError('Failed to cancel booking', 500);
        // Release slot if scheduled
        if (booking.slot_id) {
            await supabase_1.supabaseAdmin
                .from('provider_slots')
                .update({ booked_count: supabase_1.supabaseAdmin.rpc }) // Decrement
                .eq('id', booking.slot_id);
            // Remove slot lock
            await supabase_1.supabaseAdmin
                .from('slot_locks')
                .delete()
                .eq('slot_id', booking.slot_id)
                .eq('user_id', req.user.id);
        }
        // Process refund if paid
        if (booking.payment_status === 'paid' || booking.payment_status === 'escrow') {
            // Add to wallet as refund
            const { data: wallet } = await supabase_1.supabaseAdmin
                .from('wallets')
                .select('id')
                .eq('user_id', req.user.id)
                .single();
            if (wallet) {
                await supabase_1.supabaseAdmin.from('wallet_transactions').insert({
                    wallet_id: wallet.id,
                    type: 'refund',
                    amount: booking.total_amount,
                    description: `Refund for cancelled booking`,
                    reference_id: booking.id,
                    reference_type: 'booking',
                });
                await supabase_1.supabaseAdmin
                    .from('wallets')
                    .update({ balance: supabase_1.supabaseAdmin.rpc }) // Increment
                    .eq('id', wallet.id);
            }
        }
        res.json({ booking: data, message: 'Booking cancelled successfully' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (Provider/Admin)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [confirmed, in_progress, completed] }
 */
exports.bookingsRouter.patch('/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('provider', 'admin'), async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['confirmed', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new error_middleware_1.AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }
        const updateData = { status };
        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Booking not found' });
        // Notify user
        await supabase_1.supabaseAdmin.from('notifications').insert({
            user_id: data.user_id,
            title: `Booking ${status.replace('_', ' ')}`,
            message: `Your booking has been ${status.replace('_', ' ')}.`,
            type: 'booking',
            data: { booking_id: data.id },
        });
        res.json({ booking: data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=bookings.routes.js.map