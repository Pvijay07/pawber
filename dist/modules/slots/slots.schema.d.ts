import { z } from 'zod';
export declare const createSlotsSchema: z.ZodObject<{
    slots: z.ZodArray<z.ZodObject<{
        slot_date: z.ZodString;
        start_time: z.ZodString;
        end_time: z.ZodString;
        capacity: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        slot_date: string;
        start_time: string;
        end_time: string;
        capacity: number;
    }, {
        slot_date: string;
        start_time: string;
        end_time: string;
        capacity?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    slots: {
        slot_date: string;
        start_time: string;
        end_time: string;
        capacity: number;
    }[];
}, {
    slots: {
        slot_date: string;
        start_time: string;
        end_time: string;
        capacity?: number | undefined;
    }[];
}>;
export type CreateSlotsInput = z.infer<typeof createSlotsSchema>;
//# sourceMappingURL=slots.schema.d.ts.map