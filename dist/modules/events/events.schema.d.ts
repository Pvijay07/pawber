import { z } from 'zod';
export declare const purchaseTicketSchema: z.ZodObject<{
    event_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    event_id: string;
}, {
    event_id: string;
}>;
export declare const validateTicketSchema: z.ZodObject<{
    qr_code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    qr_code: string;
}, {
    qr_code: string;
}>;
export type PurchaseTicketInput = z.infer<typeof purchaseTicketSchema>;
export type ValidateTicketInput = z.infer<typeof validateTicketSchema>;
//# sourceMappingURL=events.schema.d.ts.map