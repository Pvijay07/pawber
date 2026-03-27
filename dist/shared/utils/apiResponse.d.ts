import { Response } from 'express';
/**
 * Standardized API response helpers.
 * Ensures consistent response format across all endpoints.
 */
export declare class ApiResponse {
    static success<T>(res: Response, data: T, statusCode?: number): Response<any, Record<string, any>>;
    static created<T>(res: Response, data: T): Response<any, Record<string, any>>;
    static paginated<T>(res: Response, data: T[], meta: {
        total: number;
        limit: number;
        offset: number;
    }): Response<any, Record<string, any>>;
    static error(res: Response, message: string, statusCode?: number, details?: any): Response<any, Record<string, any>>;
    static noContent(res: Response): Response<any, Record<string, any>>;
}
//# sourceMappingURL=apiResponse.d.ts.map