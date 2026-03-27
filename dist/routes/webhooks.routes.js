"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = require("../lib/supabase");
exports.webhooksRouter = (0, express_1.Router)();
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
/**
 * Verify Razorpay webhook signature.
 * Razorpay signs the raw body with HMAC-SHA256 using your webhook secret.
 */
function verifyRazorpaySignature(body, signature) {
    if (!RAZORPAY_WEBHOOK_SECRET) {
        console.warn('⚠️  RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification');
        return true; // Allow in dev, enforce in prod
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signature, 'hex'));
}
// ─── Razorpay Payment Webhook ───────────────────
exports.webhooksRouter.post('/razorpay', async (req, res, next) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = JSON.stringify(req.body);
        // 1. Log the webhook immediately
        await supabase_1.supabaseAdmin.from('webhook_logs').insert({
            source: 'razorpay',
            event_type: req.body?.event || 'unknown',
            payload: req.body,
            status: 'received',
        });
        // 2. Verify signature
        if (signature && !verifyRazorpaySignature(rawBody, signature)) {
            console.error('Razorpay webhook: Invalid signature');
            await supabase_1.supabaseAdmin.from('webhook_logs').update({
                status: 'rejected',
                error_message: 'Invalid signature',
                processed_at: new Date().toISOString(),
            }).eq('payload->>event', req.body?.event).eq('source', 'razorpay');
            return res.status(400).json({ error: 'Invalid signature' });
        }
        const event = req.body?.event;
        const payload = req.body?.payload;
        // ── payment.authorized ─────────────────────
        // Payment has been authorized but not yet captured
        if (event === 'payment.authorized') {
            const payment = payload?.payment?.entity;
            if (payment) {
                await supabase_1.supabaseAdmin
                    .from('payments')
                    .update({
                    status: 'authorized',
                    gateway_response: payment,
                })
                    .eq('order_id', payment.order_id);
            }
        }
        // ── payment.captured ───────────────────────
        // Payment successfully captured — this is the "success" event
        if (event === 'payment.captured') {
            const payment = payload?.payment?.entity;
            if (payment) {
                const orderId = payment.order_id;
                // Find our payment record
                const { data: dbPayment } = await supabase_1.supabaseAdmin
                    .from('payments')
                    .select('id, booking_id, amount')
                    .eq('order_id', orderId)
                    .single();
                if (dbPayment) {
                    // Update payment status
                    await supabase_1.supabaseAdmin
                        .from('payments')
                        .update({
                        status: 'success',
                        gateway_response: payment,
                    })
                        .eq('id', dbPayment.id);
                    // Update booking payment status → escrow (held until service completed)
                    if (dbPayment.booking_id) {
                        await supabase_1.supabaseAdmin
                            .from('bookings')
                            .update({ payment_status: 'escrow' })
                            .eq('id', dbPayment.booking_id);
                        // Create escrow record
                        await supabase_1.supabaseAdmin.from('escrow').insert({
                            booking_id: dbPayment.booking_id,
                            amount: dbPayment.amount,
                            status: 'held',
                        });
                        // Get booking user for notification
                        const { data: booking } = await supabase_1.supabaseAdmin
                            .from('bookings')
                            .select('user_id, total_amount')
                            .eq('id', dbPayment.booking_id)
                            .single();
                        if (booking) {
                            await supabase_1.supabaseAdmin.from('notifications').insert({
                                user_id: booking.user_id,
                                title: '💳 Payment Successful!',
                                message: `₹${booking.total_amount} payment received. Your booking is confirmed.`,
                                type: 'payment',
                                data: { booking_id: dbPayment.booking_id, payment_id: dbPayment.id },
                            });
                        }
                    }
                }
                else {
                    console.warn('Razorpay webhook: No payment found for order_id:', orderId);
                }
            }
        }
        // ── payment.failed ─────────────────────────
        if (event === 'payment.failed') {
            const payment = payload?.payment?.entity;
            if (payment) {
                await supabase_1.supabaseAdmin
                    .from('payments')
                    .update({
                    status: 'failed',
                    gateway_response: payment,
                })
                    .eq('order_id', payment.order_id);
                // Notify user of failure
                const { data: dbPayment } = await supabase_1.supabaseAdmin
                    .from('payments')
                    .select('booking_id')
                    .eq('order_id', payment.order_id)
                    .single();
                if (dbPayment?.booking_id) {
                    const { data: booking } = await supabase_1.supabaseAdmin
                        .from('bookings')
                        .select('user_id')
                        .eq('id', dbPayment.booking_id)
                        .single();
                    if (booking) {
                        await supabase_1.supabaseAdmin.from('notifications').insert({
                            user_id: booking.user_id,
                            title: '❌ Payment Failed',
                            message: `Your payment could not be processed. Please try again.`,
                            type: 'payment',
                            data: { booking_id: dbPayment.booking_id },
                        });
                    }
                }
            }
        }
        // ── refund.processed ───────────────────────
        if (event === 'refund.processed') {
            const refund = payload?.refund?.entity;
            if (refund) {
                const { data: dbPayment } = await supabase_1.supabaseAdmin
                    .from('payments')
                    .select('id, booking_id, user_id')
                    .eq('order_id', refund.order_id)
                    .single();
                if (dbPayment) {
                    // Update payment to refunded
                    await supabase_1.supabaseAdmin
                        .from('payments')
                        .update({
                        status: 'refunded',
                        gateway_response: refund,
                    })
                        .eq('id', dbPayment.id);
                    // Update booking
                    if (dbPayment.booking_id) {
                        await supabase_1.supabaseAdmin
                            .from('bookings')
                            .update({ payment_status: 'refunded' })
                            .eq('id', dbPayment.booking_id);
                        // Update escrow
                        await supabase_1.supabaseAdmin
                            .from('escrow')
                            .update({ status: 'refunded' })
                            .eq('booking_id', dbPayment.booking_id);
                    }
                    // Notify user
                    const refundAmount = (refund.amount / 100).toFixed(2); // Razorpay uses paise
                    await supabase_1.supabaseAdmin.from('notifications').insert({
                        user_id: dbPayment.user_id,
                        title: '💰 Refund Processed',
                        message: `₹${refundAmount} has been refunded to your original payment method.`,
                        type: 'payment',
                        data: { refund_id: refund.id, booking_id: dbPayment.booking_id },
                    });
                }
            }
        }
        // ── refund.failed ──────────────────────────
        if (event === 'refund.failed') {
            const refund = payload?.refund?.entity;
            if (refund) {
                console.error('Razorpay refund failed:', refund.id);
                // Log but don't update status — needs manual intervention
            }
        }
        // ── order.paid ─────────────────────────────
        if (event === 'order.paid') {
            const order = payload?.order?.entity;
            if (order) {
                // Confirm the booking when the full order is paid
                await supabase_1.supabaseAdmin
                    .from('bookings')
                    .update({ status: 'confirmed' })
                    .eq('id', order.notes?.booking_id);
            }
        }
        // Mark webhook as processed
        await supabase_1.supabaseAdmin
            .from('webhook_logs')
            .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
        })
            .eq('payload->>event', event)
            .eq('source', 'razorpay');
        res.json({ status: 'ok' });
    }
    catch (err) {
        console.error('Razorpay webhook processing error:', err);
        // Always return 200 to prevent webhook retries
        res.json({ status: 'error', message: 'Processing failed' });
    }
});
// ─── QR Scan Webhook ────────────────────────────
exports.webhooksRouter.post('/qr-scan', async (req, res, next) => {
    try {
        await supabase_1.supabaseAdmin.from('webhook_logs').insert({
            source: 'qr',
            event_type: 'scan',
            payload: req.body,
            status: 'received',
        });
        const { qr_code } = req.body;
        if (qr_code) {
            const { data: ticket } = await supabase_1.supabaseAdmin
                .from('event_tickets')
                .select('id, status, event_id, user_id')
                .eq('qr_code', qr_code)
                .single();
            if (ticket && ticket.status === 'valid') {
                await supabase_1.supabaseAdmin
                    .from('event_tickets')
                    .update({ status: 'used' })
                    .eq('id', ticket.id);
                return res.json({ valid: true, ticket });
            }
            return res.json({ valid: false, message: 'Invalid or already used ticket' });
        }
        res.json({ status: 'ok' });
    }
    catch (err) {
        console.error('QR webhook error:', err);
        res.json({ status: 'error' });
    }
});
//# sourceMappingURL=webhooks.routes.js.map