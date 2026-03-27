"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotsController = exports.SlotsController = void 0;
const slots_service_1 = require("./slots.service");
class SlotsController {
    async getByProvider(req, res, _n) {
        const query = {
            date: req.query.date,
            from_date: req.query.from_date,
            to_date: req.query.to_date,
        };
        const r = await slots_service_1.slotsService.getByProvider(req.params.providerId, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async lockSlot(req, res, _n) {
        const r = await slots_service_1.slotsService.lockSlot(req.user.id, req.params.slotId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async releaseLock(req, res, _n) {
        const r = await slots_service_1.slotsService.releaseLock(req.user.id, req.params.slotId);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async bulkCreate(req, res, _n) {
        const r = await slots_service_1.slotsService.bulkCreate(req.user.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async toggleBlock(req, res, _n) {
        const r = await slots_service_1.slotsService.toggleBlock(req.user.id, req.params.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async getMySlots(req, res, _n) {
        const query = {
            date: req.query.date,
            from_date: req.query.from_date,
            to_date: req.query.to_date,
        };
        const r = await slots_service_1.slotsService.getMySlots(req.user.id, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}
exports.SlotsController = SlotsController;
exports.slotsController = new SlotsController();
//# sourceMappingURL=slots.controller.js.map