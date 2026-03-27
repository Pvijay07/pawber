import { z } from 'zod';

export const listNotificationsSchema = z.object({
    unread_only: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
});
