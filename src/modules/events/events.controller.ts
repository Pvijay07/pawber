import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { eventsService } from './events.service';

export class EventsController {

    async list(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            upcoming_only: req.query.upcoming_only !== 'false',
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await eventsService.list(query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getById(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await eventsService.getById(req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async purchaseTicket(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await eventsService.purchaseTicket(req.user!.id, req.params.id);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getMyTickets(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await eventsService.getMyTickets(req.user!.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async validateTicket(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await eventsService.validateTicket(req.body.qr_code);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}

export const eventsController = new EventsController();
