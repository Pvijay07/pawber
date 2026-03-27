import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    booking_id: z.ZodString;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
    booking_id: string;
}, {
    amount: number;
    booking_id: string;
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    razorpay_order_id: z.ZodString;
    razorpay_payment_id: z.ZodString;
    razorpay_signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}, {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}>;
export declare const refundSchema: z.ZodObject<{
    payment_id: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    payment_id: string;
    reason?: string | undefined;
    amount?: number | undefined;
}, {
    payment_id: string;
    reason?: string | undefined;
    amount?: number | undefined;
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
//# sourceMappingURL=payments.schema.d.ts.map