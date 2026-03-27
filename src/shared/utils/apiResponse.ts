import { Response } from 'express';

/**
 * Standardized API response helpers.
 * Ensures consistent response format across all endpoints.
 */
export class ApiResponse {
    static success<T>(res: Response, data: T, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            data,
        });
    }

    static created<T>(res: Response, data: T) {
        return this.success(res, data, 201);
    }

    static paginated<T>(
        res: Response,
        data: T[],
        meta: { total: number; limit: number; offset: number }
    ) {
        return res.status(200).json({
            success: true,
            data,
            meta: {
                total: meta.total,
                limit: meta.limit,
                offset: meta.offset,
                hasMore: meta.offset + meta.limit < meta.total,
            },
        });
    }

    static error(res: Response, message: string, statusCode = 500, details?: any) {
        return res.status(statusCode).json({
            success: false,
            error: {
                message,
                ...(details && { details }),
            },
        });
    }

    static noContent(res: Response) {
        return res.status(204).send();
    }
}
