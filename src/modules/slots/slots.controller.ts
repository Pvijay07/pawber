import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { slotsService } from './slots.service';

export class SlotsController {

    async getByProvider(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            date: req.query.date as string,
            from_date: req.query.from_date as string,
            to_date: req.query.to_date as string,
        };
        const r = await slotsService.getByProvider(req.params.providerId, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async lockSlot(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await slotsService.lockSlot(req.user!.id, req.params.slotId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async releaseLock(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await slotsService.releaseLock(req.user!.id, req.params.slotId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async bulkCreate(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await slotsService.bulkCreate(req.user!.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async toggleBlock(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await slotsService.toggleBlock(req.user!.id, req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getMySlots(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            date: req.query.date as string,
            from_date: req.query.from_date as string,
            to_date: req.query.to_date as string,
        };
        const r = await slotsService.getMySlots(req.user!.id, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}

export const slotsController = new SlotsController();
