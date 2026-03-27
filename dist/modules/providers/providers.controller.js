"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providersController = exports.ProvidersController = void 0;
const providers_service_1 = require("./providers.service");
class ProvidersController {
    async list(req, res, _n) {
        const query = {
            category: req.query.category,
            city: req.query.city,
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
        };
        const r = await providers_service_1.providersService.list(query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getById(req, res, _n) {
        const r = await providers_service_1.providersService.getById(req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async register(req, res, _n) {
        const r = await providers_service_1.providersService.register(req.user.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async updateMe(req, res, _n) {
        const r = await providers_service_1.providersService.updateMe(req.user.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async uploadDocument(req, res, _n) {
        const r = await providers_service_1.providersService.uploadDocument(req.user.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getMyBookings(req, res, _n) {
        const r = await providers_service_1.providersService.getMyBookings(req.user.id, req.query.status);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async addService(req, res, _n) {
        const r = await providers_service_1.providersService.addService(req.user.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getMe(req, res, _n) {
        const r = await providers_service_1.providersService.getMyProfile(req.user.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getServices(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.getServicesByProvider(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getBookings(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.getBookingsByProvider(providerId, req.query.status);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getBids(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.getBids(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async createBid(req, res, _n) {
        const providerId = req.user.id;
        const r = await providers_service_1.providersService.createBid(providerId, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async listBlockedDates(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.listBlockedDates(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async addBlockedDate(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.addBlockedDate(providerId, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async removeBlockedDate(req, res, _n) {
        const r = await providers_service_1.providersService.removeBlockedDate(req.params.blockedDateId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true } : { success: false, error: { message: r.error } });
    }
    async getPerformance(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.getPerformance(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getWallet(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.getWalletSummary(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getTransactions(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const query = {
            type: req.query.type,
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
        };
        const r = await providers_service_1.providersService.getTransactionsByProvider(providerId, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getEvents(req, res, _n) {
        const providerId = req.params.id || (req.user && req.user.id);
        const r = await providers_service_1.providersService.getEventsByProvider(providerId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}
exports.ProvidersController = ProvidersController;
exports.providersController = new ProvidersController();
//# sourceMappingURL=providers.controller.js.map