import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { reviewsService } from './reviews.service';

export class ReviewsController {

    async getByProvider(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await reviewsService.getByProvider(req.params.providerId, query.limit, query.offset);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async create(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await reviewsService.create(req.user!.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async reply(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await reviewsService.reply(req.user!.id, req.params.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}

export const reviewsController = new ReviewsController();
