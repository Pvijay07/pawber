import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { paymentsService } from './payments.service';

export class PaymentsController {

    async createOrder(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await paymentsService.createOrder(req.user!.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async verifyPayment(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await paymentsService.verifyPayment(req.user!.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async refund(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await paymentsService.refund(req.user!.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getHistory(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await paymentsService.getHistory(req.user!.id, query.limit, query.offset);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}

export const paymentsController = new PaymentsController();
