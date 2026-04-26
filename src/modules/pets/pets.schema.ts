import { z } from 'zod';

export const createPetSchema = z.object({
    name: z.string().min(1),
    type: z.string().optional(),
    breed: z.string().optional(),
    age: z.string().optional(),
    weight: z.number().min(0).optional(),
    medical_notes: z.string().optional(),
    vaccination_status: z.string().optional(),
    image_url: z.string().url().optional(),
});

export const updatePetSchema = createPetSchema.partial();

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
