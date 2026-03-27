import { z } from 'zod';

export const createSlotsSchema = z.object({
    slots: z.array(z.object({
        slot_date: z.string(), // YYYY-MM-DD
        start_time: z.string(), // HH:MM
        end_time: z.string(),   // HH:MM
        capacity: z.number().int().min(1).default(1),
    })).min(1),
});

export type CreateSlotsInput = z.infer<typeof createSlotsSchema>;
