import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    accessToken?: string;
}
/**
 * Verifies the Supabase JWT token from Authorization header.
 * Attaches user info + role from profiles table to req.user.
 */
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Role-based access control middleware.
 * Usage: authorize('admin'), authorize('provider', 'admin')
 */
export declare function authorize(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.middleware.d.ts.map