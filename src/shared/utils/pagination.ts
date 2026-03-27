import { z } from 'zod';

/**
 * Standard pagination query parameters schema.
 * Use with validateQuery middleware.
 */
export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * Parse pagination from Express query object.
 */
export function parsePagination(query: Record<string, any>): PaginationQuery {
    return paginationSchema.parse(query);
}
