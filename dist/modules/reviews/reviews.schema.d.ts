import { z } from 'zod';
export declare const createReviewSchema: z.ZodObject<{
    booking_id: z.ZodString;
    rating: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    booking_id: string;
    rating: number;
    comment?: string | undefined;
}, {
    booking_id: string;
    rating: number;
    comment?: string | undefined;
}>;
export declare const replyReviewSchema: z.ZodObject<{
    reply: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reply: string;
}, {
    reply: string;
}>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
//# sourceMappingURL=reviews.schema.d.ts.map