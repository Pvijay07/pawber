"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsController = exports.PaymentsController = void 0;
const payments_service_1 = require("./payments.service");
class PaymentsController {
    async createOrder(req, res, _n) {
        const r = await payments_service_1.paymentsService.createOrder(req.user.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async verifyPayment(req, res, _n) {
        const r = await payments_service_1.paymentsService.verifyPayment(req.user.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async refund(req, res, _n) {
        const r = await payments_service_1.paymentsService.refund(req.user.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getHistory(req, res, _n) {
        const query = {
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
        };
        const r = await payments_service_1.paymentsService.getHistory(req.user.id, query.limit, query.offset);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}
exports.PaymentsController = PaymentsController;
exports.paymentsController = new PaymentsController();
//# sourceMappingURL=payments.controller.js.map