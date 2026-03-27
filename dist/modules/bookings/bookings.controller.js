"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsController = exports.BookingsController = void 0;
const bookings_service_1 = require("./bookings.service");
/**
 * Bookings Controller — thin HTTP adapter.
 * Extracts data from request, calls service, sends response.
 * NO business logic here.
 */
class BookingsController {
    async create(req, res, _next) {
        const result = await bookings_service_1.bookingsService.create(req.user.id, req.body);
        if (result.success) {
            return res.status(result.statusCode || 201).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async list(req, res, _next) {
        const query = {
            status: req.query.status,
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
        };
        const result = await bookings_service_1.bookingsService.listByUser(req.user.id, query);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async getById(req, res, _next) {
        const result = await bookings_service_1.bookingsService.getById(req.user.id, req.params.id);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async cancel(req, res, _next) {
        const input = { reason: req.body.reason };
        const result = await bookings_service_1.bookingsService.cancel(req.user.id, req.params.id, input);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async updateStatus(req, res, _next) {
        const result = await bookings_service_1.bookingsService.updateStatus(req.params.id, req.body.status);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
}
exports.BookingsController = BookingsController;
exports.bookingsController = new BookingsController();
//# sourceMappingURL=bookings.controller.js.map