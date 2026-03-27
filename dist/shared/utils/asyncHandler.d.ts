import { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Wraps an async route handler to automatically catch errors
 * and pass them to Express error middleware.
 *
 * Eliminates the need for try/catch in every route handler.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler;
//# sourceMappingURL=asyncHandler.d.ts.map