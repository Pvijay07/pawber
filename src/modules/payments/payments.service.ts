import crypto from 'crypto';
import { supabaseAdmin, getRazorpay } from '../../shared/lib';
import { env } from '../../config';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { CreateOrderInput, VerifyPaymentInput, RefundInput } from './payments.schema';

const log = createLogger('PaymentsService');

export class PaymentsService {

    async createOrder(userId: string, input: CreateOrderInput): Promise<ServiceResult<any>> {
        const { booking_id, amount } = input;

        // Verify booking
        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select('id, payment_status, status')
            .eq('id', booking_id)
            .eq('user_id', userId)
            .single();

        if (!booking) return fail('Booking not found', 404);
        if (booking.payment_status !== 'unpaid') return fail('Booking is already paid or in escrow', 400);
        if (booking.status === 'cancelled') return fail('Cannot pay for a cancelled booking', 400);

        try {
            const razorpay = getRazorpay();
            const amountInPaise = Math.round(amount * 100);

            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `booking_${booking_id.slice(0, 8)}`,
                notes: { booking_id, user_id: userId },
            });

            await supabaseAdmin.from('payments').insert({
                booking_id,
                user_id: userId,
                order_id: order.id,
                payment_gateway: 'razorpay',
                amount,
                currency: 'INR',
                status: 'pending',
            });

            return ok({
                order_id: order.id,
                amount: amountInPaise,
                currency: 'INR',
                key_id: env.RAZORPAY_KEY_ID,
                booking_id,
                notes: order.notes,
            });
        } catch (err: any) {
            log.error('Razorpay order creation failed', err);
            return fail('Payment gateway error', 503);
        }
    }

    async verifyPayment(userId: string, input: VerifyPaymentInput): Promise<ServiceResult<any>> {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

        const generatedSignature = crypto
            .createHmac('sha256', env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return fail('Payment verification failed — invalid signature', 400);
        }

        const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('id, booking_id')
            .eq('order_id', razorpay_order_id)
            .single();

        if (!payment) return fail('Payment record not found', 404);

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

        if (payment.booking_id) {
            await supabaseAdmin
                .from('bookings')
                .update({ payment_status: 'escrow', status: 'confirmed' })
                .eq('id', payment.booking_id);

            const { data: b } = await supabaseAdmin
                .from('bookings')
                .select('total_amount, user_id')
                .eq('id', payment.booking_id)
                .single();

            if (b) {
                await supabaseAdmin.from('escrow').insert({
                    booking_id: payment.booking_id,
                    amount: b.total_amount,
                    status: 'held',
                });

                await supabaseAdmin.from('notifications').insert({
                    user_id: b.user_id,
                    title: '✅ Payment Confirmed',
                    message: `₹${b.total_amount} payment verified. Your booking is confirmed!`,
                    type: 'payment',
                    data: { booking_id: payment.booking_id },
                });
            }
        }

        return ok({ verified: true, payment_id: razorpay_payment_id, order_id: razorpay_order_id });
    }

    async refund(userId: string, input: RefundInput): Promise<ServiceResult<any>> {
        const { payment_id, amount, reason } = input;

        const { data: dbPayment } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', payment_id)
            .eq('user_id', userId)
            .single();

        if (!dbPayment) return fail('Payment not found', 404);
        if (dbPayment.status !== 'success') return fail('Can only refund successful payments', 400);

        const razorpayPaymentId = dbPayment.gateway_response?.razorpay_payment_id;
        if (!razorpayPaymentId) return fail('Razorpay payment ID not found', 400);

        try {
            const razorpay = getRazorpay();
            const refund = await razorpay.payments.refund(razorpayPaymentId, {
                amount: amount ? Math.round(amount * 100) : undefined,
                notes: { reason: reason || 'Customer requested refund' },
            });

            return ok({
                refund_id: refund.id,
                amount: (refund.amount as number) / 100,
                status: refund.status,
                message: 'Refund initiated',
            });
        } catch (err: any) {
            log.error('Razorpay refund failed', err);
            return fail('Refund failed', 500);
        }
    }

    async getHistory(userId: string, limit: number, offset: number): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('payments')
            .select('*, booking:bookings(id, status, service:services(name))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return fail(error.message, 500);
        return ok({ payments: data });
    }
}

export const paymentsService = new PaymentsService();
