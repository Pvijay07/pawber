import { z } from 'zod';

export const createOrderSchema = z.object({
    booking_id: z.string().uuid(),
    amount: z.number().min(1),
});

export const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

export const refundSchema = z.object({
    payment_id: z.string(),
    amount: z.number().min(1).optional(),
    reason: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
