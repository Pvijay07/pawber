import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
/**
 * Bookings Controller — thin HTTP adapter.
 * Extracts data from request, calls service, sends response.
 * NO business logic here.
 */
export declare class BookingsController {
    create(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    list(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    cancel(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    updateStatus(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const bookingsController: BookingsController;
//# sourceMappingURL=bookings.controller.d.ts.map