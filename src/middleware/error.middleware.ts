import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    // Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    // Known operational errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }

    // Supabase errors (usually have a code property)
    if ('code' in err && typeof (err as any).code === 'string') {
        const code = (err as any).code;
        if (code === '23505') {
            return res.status(409).json({ error: 'Resource already exists (duplicate)' });
        }
        if (code === '23503') {
            return res.status(400).json({ error: 'Referenced resource not found' });
        }
    }

    // Unknown errors
    console.error('💥 Unhandled error:', err);
    return res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
}
