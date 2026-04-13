import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../shared/types';
export { AuthRequest };
/**
 * Verifies the Supabase JWT token from Authorization header.
 * Attaches user info + role from profiles table to req.user.
 */
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Role-based access control middleware.
 */
export declare function authorize(...roles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.middleware.d.ts.map