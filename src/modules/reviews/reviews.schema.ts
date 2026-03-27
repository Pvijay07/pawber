import { z } from 'zod';

export const createReviewSchema = z.object({
    booking_id: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

export const replyReviewSchema = z.object({
    reply: z.string().min(1),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
