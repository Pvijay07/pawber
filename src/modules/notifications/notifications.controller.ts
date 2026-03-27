import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { notificationsService } from './notifications.service';

export class NotificationsController {

    async list(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            unreadOnly: req.query.unread_only === 'true',
            limit: parseInt(req.query.limit as string) || 50,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await notificationsService.list(req.user!.id, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async markAsRead(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await notificationsService.markAsRead(req.user!.id, req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async markAllAsRead(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await notificationsService.markAllAsRead(req.user!.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async delete(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await notificationsService.delete(req.user!.id, req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}

export const notificationsController = new NotificationsController();
