import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (cleaned) data.
 */
export function validate(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return next(result.error); // caught by error.middleware
        }
        req.body = result.data;
        next();
    };
}

/**
 * Validates query parameters.
 */
export function validateQuery(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return next(result.error);
        }
        req.query = result.data;
        next();
    };
}
