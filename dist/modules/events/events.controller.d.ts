import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class EventsController {
    list(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    purchaseTicket(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getMyTickets(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    validateTicket(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const eventsController: EventsController;
//# sourceMappingURL=events.controller.d.ts.map