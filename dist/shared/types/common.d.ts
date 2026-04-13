import { Request } from 'express';
/**
 * Extended Express Request with authenticated user info.
 */
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
    accessToken?: string;
}
export type UserRole = 'client' | 'provider' | 'admin' | 'user';
/**
 * Standard service result pattern.
 * All service methods return this to keep controller logic clean.
 */
export type ServiceResult<T> = {
    success: true;
    data: T;
    statusCode?: number;
} | {
    success: false;
    error: string;
    statusCode: number;
    details?: any;
};
/**
 * Helper to create success result
 */
export declare function ok<T>(data: T, statusCode?: number): ServiceResult<T>;
/**
 * Helper to create error result
 */
export declare function fail<T = never>(error: string, statusCode?: number, details?: any): ServiceResult<T>;
//# sourceMappingURL=common.d.ts.map