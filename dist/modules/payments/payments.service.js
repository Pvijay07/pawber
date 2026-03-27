"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsService = exports.PaymentsService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const lib_1 = require("../../shared/lib");
const config_1 = require("../../config");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('PaymentsService');
class PaymentsService {
    async createOrder(userId, input) {
        const { booking_id, amount } = input;
        // Verify booking
        const { data: booking } = await lib_1.supabaseAdmin
            .from('bookings')
            .select('id, payment_status, status')
            .eq('id', booking_id)
            .eq('user_id', userId)
            .single();
        if (!booking)
            return (0, types_1.fail)('Booking not found', 404);
        if (booking.payment_status !== 'unpaid')
            return (0, types_1.fail)('Booking is already paid or in escrow', 400);
        if (booking.status === 'cancelled')
            return (0, types_1.fail)('Cannot pay for a cancelled booking', 400);
        try {
            const razorpay = (0, lib_1.getRazorpay)();
            const amountInPaise = Math.round(amount * 100);
            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `booking_${booking_id.slice(0, 8)}`,
                notes: { booking_id, user_id: userId },
            });
            await lib_1.supabaseAdmin.from('payments').insert({
                booking_id,
                user_id: userId,
                order_id: order.id,
                payment_gateway: 'razorpay',
                amount,
                currency: 'INR',
                status: 'pending',
            });
            return (0, types_1.ok)({
                order_id: order.id,
                amount: amountInPaise,
                currency: 'INR',
                key_id: config_1.env.RAZORPAY_KEY_ID,
                booking_id,
                notes: order.notes,
            });
        }
        catch (err) {
            log.error('Razorpay order creation failed', err);
            return (0, types_1.fail)('Payment gateway error', 503);
        }
    }
    async verifyPayment(userId, input) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;
        const generatedSignature = crypto_1.default
            .createHmac('sha256', config_1.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        if (generatedSignature !== razorpay_signature) {
            return (0, types_1.fail)('Payment verification failed — invalid signature', 400);
        }
        const { data: payment } = await lib_1.supabaseAdmin
            .from('payments')
            .select('id, booking_id')
            .eq('order_id', razorpay_order_id)
            .single();
        if (!payment)
            return (0, types_1.fail)('Payment record not found', 404);
        await lib_1.supabaseAdmin
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
        if (payment.booking_id) {
            await lib_1.supabaseAdmin
                .from('bookings')
                .update({ payment_status: 'escrow', status: 'confirmed' })
                .eq('id', payment.booking_id);
            const { data: b } = await lib_1.supabaseAdmin
                .from('bookings')
                .select('total_amount, user_id')
                .eq('id', payment.booking_id)
                .single();
            if (b) {
                await lib_1.supabaseAdmin.from('escrow').insert({
                    booking_id: payment.booking_id,
                    amount: b.total_amount,
                    status: 'held',
                });
                await lib_1.supabaseAdmin.from('notifications').insert({
                    user_id: b.user_id,
                    title: '✅ Payment Confirmed',
                    message: `₹${b.total_amount} payment verified. Your booking is confirmed!`,
                    type: 'payment',
                    data: { booking_id: payment.booking_id },
                });
            }
        }
        return (0, types_1.ok)({ verified: true, payment_id: razorpay_payment_id, order_id: razorpay_order_id });
    }
    async refund(userId, input) {
        const { payment_id, amount, reason } = input;
        const { data: dbPayment } = await lib_1.supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', payment_id)
            .eq('user_id', userId)
            .single();
        if (!dbPayment)
            return (0, types_1.fail)('Payment not found', 404);
        if (dbPayment.status !== 'success')
            return (0, types_1.fail)('Can only refund successful payments', 400);
        const razorpayPaymentId = dbPayment.gateway_response?.razorpay_payment_id;
        if (!razorpayPaymentId)
            return (0, types_1.fail)('Razorpay payment ID not found', 400);
        try {
            const razorpay = (0, lib_1.getRazorpay)();
            const refund = await razorpay.payments.refund(razorpayPaymentId, {
                amount: amount ? Math.round(amount * 100) : undefined,
                notes: { reason: reason || 'Customer requested refund' },
            });
            return (0, types_1.ok)({
                refund_id: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                message: 'Refund initiated',
            });
        }
        catch (err) {
            log.error('Razorpay refund failed', err);
            return (0, types_1.fail)('Refund failed', 500);
        }
    }
    async getHistory(userId, limit, offset) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('payments')
            .select('*, booking:bookings(id, status, service:services(name))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ payments: data });
    }
}
exports.PaymentsService = PaymentsService;
exports.paymentsService = new PaymentsService();
//# sourceMappingURL=payments.service.js.map