"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsController = exports.EventsController = void 0;
const events_service_1 = require("./events.service");
class EventsController {
    async list(req, res, _n) {
        const query = {
            upcoming_only: req.query.upcoming_only !== 'false',
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
        };
        const r = await events_service_1.eventsService.list(query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getById(req, res, _n) {
        const r = await events_service_1.eventsService.getById(req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async purchaseTicket(req, res, _n) {
        const r = await events_service_1.eventsService.purchaseTicket(req.user.id, req.params.id);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getMyTickets(req, res, _n) {
        const r = await events_service_1.eventsService.getMyTickets(req.user.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async validateTicket(req, res, _n) {
        const r = await events_service_1.eventsService.validateTicket(req.body.qr_code);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}
exports.EventsController = EventsController;
exports.eventsController = new EventsController();
//# sourceMappingURL=events.controller.js.map