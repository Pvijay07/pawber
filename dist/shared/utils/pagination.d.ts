import { z } from 'zod';
/**
 * Standard pagination query parameters schema.
 * Use with validateQuery middleware.
 */
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
/**
 * Parse pagination from Express query object.
 */
export declare function parsePagination(query: Record<string, any>): PaginationQuery;
//# sourceMappingURL=pagination.d.ts.map