import { z } from 'zod';
export declare const listNotificationsSchema: z.ZodObject<{
    unread_only: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
    offset: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit?: string | undefined;
    offset?: string | undefined;
    unread_only?: string | undefined;
}, {
    limit?: string | undefined;
    offset?: string | undefined;
    unread_only?: string | undefined;
}>;
//# sourceMappingURL=notifications.schema.d.ts.map