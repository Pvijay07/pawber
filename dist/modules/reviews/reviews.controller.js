"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsController = exports.ReviewsController = void 0;
const reviews_service_1 = require("./reviews.service");
class ReviewsController {
    async getByProvider(req, res, _n) {
        const query = {
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
        };
        const r = await reviews_service_1.reviewsService.getByProvider(req.params.providerId, query.limit, query.offset);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async create(req, res, _n) {
        const r = await reviews_service_1.reviewsService.create(req.user.id, req.body);
        return res.status(r.success ? 201 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async reply(req, res, _n) {
        const r = await reviews_service_1.reviewsService.reply(req.user.id, req.params.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}
exports.ReviewsController = ReviewsController;
exports.reviewsController = new ReviewsController();
//# sourceMappingURL=reviews.controller.js.map