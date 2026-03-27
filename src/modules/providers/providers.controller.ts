import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { providersService } from './providers.service';

export class ProvidersController {

    async list(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            category: req.query.category as string,
            city: req.query.city as string,
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await providersService.list(query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getById(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.getById(req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async register(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.register(req.user!.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async updateMe(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.updateMe(req.user!.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async uploadDocument(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.uploadDocument(req.user!.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getMyBookings(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.getMyBookings(req.user!.id, req.query.status as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async addService(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.addService(req.user!.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getMe(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.getMyProfile(req.user!.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getServices(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.getServicesByProvider(providerId as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getBookings(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.getBookingsByProvider(providerId as string, req.query.status as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getBids(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.getBids(providerId as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async createBid(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.user!.id;
        const r = await providersService.createBid(providerId, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async listBlockedDates(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.listBlockedDates(providerId as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async addBlockedDate(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.addBlockedDate(providerId as string, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async removeBlockedDate(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.removeBlockedDate(req.params.blockedDateId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true } : { success: false, error: { message: r.error } });
    }

    async getPerformance(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.getPerformance(providerId as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getWallet(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.getWalletSummary(providerId as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getTransactions(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const query = {
            type: req.query.type as string,
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await providersService.getTransactionsByProvider(providerId as string, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getEvents(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providersService.getEventsByProvider(providerId as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}

export const providersController = new ProvidersController();
