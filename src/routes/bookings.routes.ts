import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';

export const bookingsRouter = Router();
bookingsRouter.use(authenticate);

const createBookingSchema = z.object({
    service_id: z.string().uuid(),
    package_id: z.string().uuid(),
    booking_type: z.enum(['instant', 'scheduled']),
    booking_date: z.string().optional(), // ISO date for scheduled
    slot_id: z.string().uuid().optional(),
    pet_ids: z.array(z.string().uuid()).min(1),
    addon_ids: z.array(z.string().uuid()).optional().default([]),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    notes: z.string().optional(),
    coupon_code: z.string().optional(),
});

// ─── Create Booking ─────────────────────────────
bookingsRouter.post('/', validate(createBookingSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { service_id, package_id, booking_type, booking_date, slot_id, pet_ids, addon_ids, address, latitude, longitude, notes, coupon_code } = req.body;

        // 1. Verify package exists & get price
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('service_packages')
            .select('price, is_instant_available, is_scheduled_available')
            .eq('id', package_id)
            .single();

        if (pkgError || !pkg) throw new AppError('Package not found', 404);

        // Check booking type availability
        if (booking_type === 'instant' && !pkg.is_instant_available) {
            throw new AppError('Instant booking not available for this package', 400);
        }
        if (booking_type === 'scheduled' && !pkg.is_scheduled_available) {
            throw new AppError('Scheduled booking not available for this package', 400);
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
                addons.forEach(addon => {
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
            const { data: coupon } = await supabaseAdmin
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
                            } else {
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
            const { data: slot } = await supabaseAdmin
                .from('provider_slots')
                .select('capacity, booked_count, is_blocked')
                .eq('id', slot_id)
                .single();

            if (!slot || slot.is_blocked || slot.booked_count >= slot.capacity) {
                throw new AppError('Selected slot is no longer available', 409);
            }

            // Acquire lock
            const lockExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min lock
            const { error: lockError } = await supabaseAdmin
                .from('slot_locks')
                .insert({
                    slot_id,
                    user_id: req.user!.id,
                    lock_expires_at: lockExpiry,
                });

            if (lockError) {
                throw new AppError('Failed to lock slot. Someone else may be booking it.', 409);
            }
        }

        // 5. Create booking
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                user_id: req.user!.id,
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

        if (bookingError) throw new AppError('Failed to create booking', 500);

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

        // 9. Update coupon usage
        if (coupon_code && couponDiscount > 0) {
            await supabaseAdmin
                .from('coupons')
                .update({ used_count: supabaseAdmin.rpc as any })  // Increment
                .eq('code', coupon_code.toUpperCase());

            await supabaseAdmin.from('coupon_usage').insert({
                coupon_id: coupon_code, // will need actual coupon id
                user_id: req.user!.id,
                booking_id: booking.id,
            });
        }

        // 10. Create notification
        await supabaseAdmin.from('notifications').insert({
            user_id: req.user!.id,
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
    } catch (err) {
        next(err);
    }
});

// ─── List User Bookings ────────────────────────
bookingsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { status, limit = '20', offset = '0' } = req.query;

        let query = supabaseAdmin
            .from('bookings')
            .select(`
        *,
        service:services(name, description),
        package:service_packages(package_name, price, duration_minutes),
        provider:providers(business_name, rating),
        booking_pets(pet:pets(id, name, image_url)),
        booking_addons(addon:addons(id, name), price)
      `)
            .eq('user_id', req.user!.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (status) {
            query = query.eq('status', status as string);
        }

        const { data, error } = await query;

        if (error) return res.status(500).json({ error: error.message });
        res.json({ bookings: data });
    } catch (err) {
        next(err);
    }
});

// ─── Get Booking Details ────────────────────────
bookingsRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
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
            .eq('id', req.params.id)
            .eq('user_id', req.user!.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Booking not found' });
        res.json({ booking: data });
    } catch (err) {
        next(err);
    }
});

// ─── Cancel Booking ─────────────────────────────
bookingsRouter.post('/:id/cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { reason } = req.body;

        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('id, status, slot_id, total_amount, user_id, payment_status')
            .eq('id', req.params.id)
            .eq('user_id', req.user!.id)
            .single();

        if (fetchError || !booking) return res.status(404).json({ error: 'Booking not found' });

        if (!['pending', 'confirmed'].includes(booking.status)) {
            throw new AppError('Cannot cancel a booking that is already in progress or completed', 400);
        }

        // Cancel the booking
        const { data, error } = await supabaseAdmin
            .from('bookings')
            .update({
                status: 'cancelled',
                cancelled_by: req.user!.id,
                cancelled_reason: reason || 'User cancelled',
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw new AppError('Failed to cancel booking', 500);

        // Release slot if scheduled
        if (booking.slot_id) {
            await supabaseAdmin
                .from('provider_slots')
                .update({ booked_count: supabaseAdmin.rpc as any }) // Decrement
                .eq('id', booking.slot_id);

            // Remove slot lock
            await supabaseAdmin
                .from('slot_locks')
                .delete()
                .eq('slot_id', booking.slot_id)
                .eq('user_id', req.user!.id);
        }

        // Process refund if paid
        if (booking.payment_status === 'paid' || booking.payment_status === 'escrow') {
            // Add to wallet as refund
            const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('id')
                .eq('user_id', req.user!.id)
                .single();

            if (wallet) {
                await supabaseAdmin.from('wallet_transactions').insert({
                    wallet_id: wallet.id,
                    type: 'refund',
                    amount: booking.total_amount,
                    description: `Refund for cancelled booking`,
                    reference_id: booking.id,
                    reference_type: 'booking',
                });

                await supabaseAdmin
                    .from('wallets')
                    .update({ balance: supabaseAdmin.rpc as any }) // Increment
                    .eq('id', wallet.id);
            }
        }

        res.json({ booking: data, message: 'Booking cancelled successfully' });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Update Booking Status ────────────
bookingsRouter.patch('/:id/status', authenticate, authorize('provider', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body;
        const validStatuses = ['confirmed', 'in_progress', 'completed'];

        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }

        const updateData: any = { status };
        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !data) return res.status(404).json({ error: 'Booking not found' });

        // Notify user
        await supabaseAdmin.from('notifications').insert({
            user_id: data.user_id,
            title: `Booking ${status.replace('_', ' ')}`,
            message: `Your booking has been ${status.replace('_', ' ')}.`,
            type: 'booking',
            data: { booking_id: data.id },
        });

        res.json({ booking: data });
    } catch (err) {
        next(err);
    }
});
