"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
class NotificationsController {
    async list(req, res, _n) {
        const query = {
            unreadOnly: req.query.unread_only === 'true',
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
        };
        const r = await notifications_service_1.notificationsService.list(req.user.id, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async markAsRead(req, res, _n) {
        const r = await notifications_service_1.notificationsService.markAsRead(req.user.id, req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async markAllAsRead(req, res, _n) {
        const r = await notifications_service_1.notificationsService.markAllAsRead(req.user.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async delete(req, res, _n) {
        const r = await notifications_service_1.notificationsService.delete(req.user.id, req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}
exports.NotificationsController = NotificationsController;
exports.notificationsController = new NotificationsController();
//# sourceMappingURL=notifications.controller.js.map