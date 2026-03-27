import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { getRazorpay, isRazorpayConfigured, razorpayKeyId } from '../lib/razorpay';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);

// ─── Create Razorpay Order ──────────────────────
const createOrderSchema = z.object({
    booking_id: z.string().uuid(),
    amount: z.number().min(1), // in INR (will be converted to paise)
});

paymentsRouter.post('/create-order', validate(createOrderSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!isRazorpayConfigured()) {
            throw new AppError('Payment gateway not configured', 503);
        }

        const { booking_id, amount } = req.body;

        // Verify booking belongs to user and is unpaid
        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select('id, total_amount, payment_status, status')
            .eq('id', booking_id)
            .eq('user_id', req.user!.id)
            .single();

        if (!booking) throw new AppError('Booking not found', 404);
        if (booking.payment_status !== 'unpaid') {
            throw new AppError('Booking is already paid or in escrow', 400);
        }
        if (booking.status === 'cancelled') {
            throw new AppError('Cannot pay for a cancelled booking', 400);
        }

        const razorpay = getRazorpay();
        const amountInPaise = Math.round(amount * 100); // Razorpay uses paise

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `booking_${booking_id.slice(0, 8)}`,
            notes: {
                booking_id,
                user_id: req.user!.id,
            },
        });

        // Save payment record
        await supabaseAdmin.from('payments').insert({
            booking_id,
            user_id: req.user!.id,
            order_id: order.id,
            payment_gateway: 'razorpay',
            amount,
            currency: 'INR',
            status: 'pending',
        });

        res.status(201).json({
            order_id: order.id,
            amount: amountInPaise,
            currency: 'INR',
            key_id: razorpayKeyId, // Frontend needs this to open checkout
            booking_id,
            notes: order.notes,
        });
    } catch (err) {
        next(err);
    }
});

// ─── Verify Payment (Client-side confirmation) ──
const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

paymentsRouter.post('/verify', validate(verifyPaymentSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature: order_id + "|" + payment_id signed with key_secret
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            throw new AppError('Payment verification failed — invalid signature', 400);
        }

        // Update payment record
        const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('id, booking_id')
            .eq('order_id', razorpay_order_id)
            .single();

        if (!payment) throw new AppError('Payment record not found', 404);

        await supabaseAdmin
            .from('payments')
            .update({
                status: 'success',
                gateway_response: {
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    verified: true,
                },
            })
            .eq('id', payment.id);

        // Update booking
        if (payment.booking_id) {
            await supabaseAdmin
                .from('bookings')
                .update({
                    payment_status: 'escrow',
                    status: 'confirmed',
                })
                .eq('id', payment.booking_id);

            // Create escrow
            const { data: bookingData } = await supabaseAdmin
                .from('bookings')
                .select('total_amount, user_id')
                .eq('id', payment.booking_id)
                .single();

            if (bookingData) {
                await supabaseAdmin.from('escrow').insert({
                    booking_id: payment.booking_id,
                    amount: bookingData.total_amount,
                    status: 'held',
                });

                await supabaseAdmin.from('notifications').insert({
                    user_id: bookingData.user_id,
                    title: '✅ Payment Confirmed',
                    message: `₹${bookingData.total_amount} payment verified. Your booking is confirmed!`,
                    type: 'payment',
                    data: { booking_id: payment.booking_id },
                });
            }
        }

        res.json({
            verified: true,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
        });
    } catch (err) {
        next(err);
    }
});

// ─── Request Refund ─────────────────────────────
const refundSchema = z.object({
    payment_id: z.string(),
    amount: z.number().min(1).optional(), // Partial refund in INR. Omit for full refund
    reason: z.string().optional(),
});

paymentsRouter.post('/refund', validate(refundSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!isRazorpayConfigured()) {
            throw new AppError('Payment gateway not configured', 503);
        }

        const { payment_id, amount, reason } = req.body;

        // Get the Razorpay payment ID from our records
        const { data: dbPayment } = await supabaseAdmin
            .from('payments')
            .select('id, booking_id, amount, status, gateway_response')
            .eq('id', payment_id)
            .eq('user_id', req.user!.id)
            .single();

        if (!dbPayment) throw new AppError('Payment not found', 404);
        if (dbPayment.status !== 'success') {
            throw new AppError('Can only refund successful payments', 400);
        }

        const razorpayPaymentId = dbPayment.gateway_response?.razorpay_payment_id;
        if (!razorpayPaymentId) {
            throw new AppError('Razorpay payment ID not found in records', 400);
        }

        const razorpay = getRazorpay();
        const refundAmountPaise = amount ? Math.round(amount * 100) : undefined;

        const refund = await razorpay.payments.refund(razorpayPaymentId, {
            amount: refundAmountPaise, // undefined = full refund
            notes: { reason: reason || 'Customer requested refund' },
        });

        res.json({
            refund_id: refund.id,
            amount: (refund.amount as number) / 100,
            status: refund.status,
            message: 'Refund initiated. You will be notified when it completes.',
        });
    } catch (err) {
        next(err);
    }
});

// ─── Get Payment History ────────────────────────
paymentsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { limit = '20', offset = '0' } = req.query;

        const { data, error } = await supabaseAdmin
            .from('payments')
            .select('*, booking:bookings(id, status, service:services(name))')
            .eq('user_id', req.user!.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ payments: data });
    } catch (err) {
        next(err);
    }
});
