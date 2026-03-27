"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const razorpay_1 = require("../lib/razorpay");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
exports.paymentsRouter = (0, express_1.Router)();
exports.paymentsRouter.use(auth_middleware_1.authenticate);
// ─── Create Razorpay Order ──────────────────────
const createOrderSchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    amount: zod_1.z.number().min(1), // in INR (will be converted to paise)
});
exports.paymentsRouter.post('/create-order', (0, validate_middleware_1.validate)(createOrderSchema), async (req, res, next) => {
    try {
        if (!(0, razorpay_1.isRazorpayConfigured)()) {
            throw new error_middleware_1.AppError('Payment gateway not configured', 503);
        }
        const { booking_id, amount } = req.body;
        // Verify booking belongs to user and is unpaid
        const { data: booking } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('id, total_amount, payment_status, status')
            .eq('id', booking_id)
            .eq('user_id', req.user.id)
            .single();
        if (!booking)
            throw new error_middleware_1.AppError('Booking not found', 404);
        if (booking.payment_status !== 'unpaid') {
            throw new error_middleware_1.AppError('Booking is already paid or in escrow', 400);
        }
        if (booking.status === 'cancelled') {
            throw new error_middleware_1.AppError('Cannot pay for a cancelled booking', 400);
        }
        const razorpay = (0, razorpay_1.getRazorpay)();
        const amountInPaise = Math.round(amount * 100); // Razorpay uses paise
        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `booking_${booking_id.slice(0, 8)}`,
            notes: {
                booking_id,
                user_id: req.user.id,
            },
        });
        // Save payment record
        await supabase_1.supabaseAdmin.from('payments').insert({
            booking_id,
            user_id: req.user.id,
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
            key_id: razorpay_1.razorpayKeyId, // Frontend needs this to open checkout
            booking_id,
            notes: order.notes,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Verify Payment (Client-side confirmation) ──
const verifyPaymentSchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string(),
    razorpay_payment_id: zod_1.z.string(),
    razorpay_signature: zod_1.z.string(),
});
exports.paymentsRouter.post('/verify', (0, validate_middleware_1.validate)(verifyPaymentSchema), async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        // Verify signature: order_id + "|" + payment_id signed with key_secret
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
        const generatedSignature = crypto_1.default
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        if (generatedSignature !== razorpay_signature) {
            throw new error_middleware_1.AppError('Payment verification failed — invalid signature', 400);
        }
        // Update payment record
        const { data: payment } = await supabase_1.supabaseAdmin
            .from('payments')
            .select('id, booking_id')
            .eq('order_id', razorpay_order_id)
            .single();
        if (!payment)
            throw new error_middleware_1.AppError('Payment record not found', 404);
        await supabase_1.supabaseAdmin
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
            await supabase_1.supabaseAdmin
                .from('bookings')
                .update({
                payment_status: 'escrow',
                status: 'confirmed',
            })
                .eq('id', payment.booking_id);
            // Create escrow
            const { data: bookingData } = await supabase_1.supabaseAdmin
                .from('bookings')
                .select('total_amount, user_id')
                .eq('id', payment.booking_id)
                .single();
            if (bookingData) {
                await supabase_1.supabaseAdmin.from('escrow').insert({
                    booking_id: payment.booking_id,
                    amount: bookingData.total_amount,
                    status: 'held',
                });
                await supabase_1.supabaseAdmin.from('notifications').insert({
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
    }
    catch (err) {
        next(err);
    }
});
// ─── Request Refund ─────────────────────────────
const refundSchema = zod_1.z.object({
    payment_id: zod_1.z.string(),
    amount: zod_1.z.number().min(1).optional(), // Partial refund in INR. Omit for full refund
    reason: zod_1.z.string().optional(),
});
exports.paymentsRouter.post('/refund', (0, validate_middleware_1.validate)(refundSchema), async (req, res, next) => {
    try {
        if (!(0, razorpay_1.isRazorpayConfigured)()) {
            throw new error_middleware_1.AppError('Payment gateway not configured', 503);
        }
        const { payment_id, amount, reason } = req.body;
        // Get the Razorpay payment ID from our records
        const { data: dbPayment } = await supabase_1.supabaseAdmin
            .from('payments')
            .select('id, booking_id, amount, status, gateway_response')
            .eq('id', payment_id)
            .eq('user_id', req.user.id)
            .single();
        if (!dbPayment)
            throw new error_middleware_1.AppError('Payment not found', 404);
        if (dbPayment.status !== 'success') {
            throw new error_middleware_1.AppError('Can only refund successful payments', 400);
        }
        const razorpayPaymentId = dbPayment.gateway_response?.razorpay_payment_id;
        if (!razorpayPaymentId) {
            throw new error_middleware_1.AppError('Razorpay payment ID not found in records', 400);
        }
        const razorpay = (0, razorpay_1.getRazorpay)();
        const refundAmountPaise = amount ? Math.round(amount * 100) : undefined;
        const refund = await razorpay.payments.refund(razorpayPaymentId, {
            amount: refundAmountPaise, // undefined = full refund
            notes: { reason: reason || 'Customer requested refund' },
        });
        res.json({
            refund_id: refund.id,
            amount: refund.amount / 100,
            status: refund.status,
            message: 'Refund initiated. You will be notified when it completes.',
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Payment History ────────────────────────
exports.paymentsRouter.get('/', async (req, res, next) => {
    try {
        const { limit = '20', offset = '0' } = req.query;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('payments')
            .select('*, booking:bookings(id, status, service:services(name))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ payments: data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=payments.routes.js.map