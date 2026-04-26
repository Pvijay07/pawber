import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { providersService } from './providers.service';
import { tierService } from './tier.service';

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

    private async resolveProviderId(req: AuthRequest): Promise<string | null> {
        const id = req.params.id;
        if (!id || id === 'me') {
            if (!req.user) return null;
            return await providersService.getProviderIdByUserId(req.user.id);
        }
        return id;
    }

    async getServices(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.getServicesByProvider(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getBookings(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.getBookingsByProvider(providerId, req.query.status as string);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getBids(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.getBids(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async createBid(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.createBid(providerId, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async listBlockedDates(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.listBlockedDates(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async addBlockedDate(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.addBlockedDate(providerId, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async removeBlockedDate(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await providersService.removeBlockedDate(req.params.blockedDateId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true } : { success: false, error: { message: r.error } });
    }

    async getPerformance(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.getPerformance(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getWallet(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.getWalletSummary(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getTransactions(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const query = {
            type: req.query.type as string,
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await providersService.getTransactionsByProvider(providerId, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async getEvents(req: AuthRequest, res: Response, _n: NextFunction) {
        const providerId = await this.resolveProviderId(req);
        if (!providerId) return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
        const r = await providersService.getEventsByProvider(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async requestTierUpgrade(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const providerId = req.user!.id;
            const requestedTier = parseInt(req.body.requested_tier);
            if (![1, 2].includes(requestedTier)) {
                return res.status(400).json({ success: false, error: { message: 'Invalid requested tier' } });
            }
            const result = await tierService.requestUpgrade(providerId, requestedTier);
            return res.status(200).json({ success: true, data: result });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: { message: err.message } });
        }
    }

    async unlockLead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const providerId = req.user!.id;
            const bookingId = req.body.booking_id;
            if (!bookingId) return res.status(400).json({ success: false, error: { message: 'booking_id is required' }});
            
            const r = await providersService.unlockLead(providerId, bookingId);
            return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: { message: err.message } });
        }
    }

    async purchaseSubscription(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const providerId = req.user!.id;
            const planType = req.body.plan_type;
            if (!['bidding_unlimited', 'certification_course'].includes(planType)) {
                return res.status(400).json({ success: false, error: { message: 'Invalid plan type' }});
            }
            const r = await providersService.purchaseSubscription(providerId, planType);
            return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: { message: err.message } });
        }
    }
}

export const providersController = new ProvidersController();
