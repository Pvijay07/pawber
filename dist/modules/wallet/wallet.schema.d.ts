import { z } from 'zod';
export declare const addFundsSchema: z.ZodObject<{
    amount: z.ZodNumber;
    payment_method: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    payment_method?: string | undefined;
}, {
    amount: number;
    payment_method?: string | undefined;
}>;
export declare const paySchema: z.ZodObject<{
    booking_id: z.ZodString;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
    booking_id: string;
}, {
    amount: number;
    booking_id: string;
}>;
export declare const autoRechargeSchema: z.ZodObject<{
    auto_recharge: z.ZodBoolean;
    auto_recharge_threshold: z.ZodOptional<z.ZodNumber>;
    auto_recharge_amount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    auto_recharge: boolean;
    auto_recharge_threshold?: number | undefined;
    auto_recharge_amount?: number | undefined;
}, {
    auto_recharge: boolean;
    auto_recharge_threshold?: number | undefined;
    auto_recharge_amount?: number | undefined;
}>;
export type AddFundsInput = z.infer<typeof addFundsSchema>;
export type PayInput = z.infer<typeof paySchema>;
export type AutoRechargeInput = z.infer<typeof autoRechargeSchema>;
//# sourceMappingURL=wallet.schema.d.ts.map