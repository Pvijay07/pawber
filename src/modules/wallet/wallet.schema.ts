import { z } from 'zod';

export const addFundsSchema = z.object({
    amount: z.number().min(100).max(50000),
    payment_method: z.string().optional(),
});

export const paySchema = z.object({
    booking_id: z.string().uuid(),
    amount: z.number().min(1),
});

export const autoRechargeSchema = z.object({
    auto_recharge: z.boolean(),
    auto_recharge_threshold: z.number().min(0).optional(),
    auto_recharge_amount: z.number().min(100).optional(),
});

export type AddFundsInput = z.infer<typeof addFundsSchema>;
export type PayInput = z.infer<typeof paySchema>;
export type AutoRechargeInput = z.infer<typeof autoRechargeSchema>;
