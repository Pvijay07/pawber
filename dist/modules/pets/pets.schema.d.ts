import { z } from 'zod';
export declare const createPetSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
    breed: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    medical_notes: z.ZodOptional<z.ZodString>;
    vaccination_status: z.ZodOptional<z.ZodString>;
    image_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type?: string | undefined;
    image_url?: string | undefined;
    breed?: string | undefined;
    age?: number | undefined;
    weight?: number | undefined;
    medical_notes?: string | undefined;
    vaccination_status?: string | undefined;
}, {
    name: string;
    type?: string | undefined;
    image_url?: string | undefined;
    breed?: string | undefined;
    age?: number | undefined;
    weight?: number | undefined;
    medical_notes?: string | undefined;
    vaccination_status?: string | undefined;
}>;
export declare const updatePetSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    breed: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    age: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    weight: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    medical_notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    vaccination_status: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    image_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    name?: string | undefined;
    image_url?: string | undefined;
    breed?: string | undefined;
    age?: number | undefined;
    weight?: number | undefined;
    medical_notes?: string | undefined;
    vaccination_status?: string | undefined;
}, {
    type?: string | undefined;
    name?: string | undefined;
    image_url?: string | undefined;
    breed?: string | undefined;
    age?: number | undefined;
    weight?: number | undefined;
    medical_notes?: string | undefined;
    vaccination_status?: string | undefined;
}>;
export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
//# sourceMappingURL=pets.schema.d.ts.map