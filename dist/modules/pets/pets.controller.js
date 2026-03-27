"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.petsController = exports.PetsController = void 0;
const pets_service_1 = require("./pets.service");
class PetsController {
    async list(req, res, _next) {
        const result = await pets_service_1.petsService.list(req.user.id);
        return res.status(result.success ? 200 : result.statusCode).json(result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } });
    }
    async getById(req, res, _next) {
        const result = await pets_service_1.petsService.getById(req.user.id, req.params.id);
        return res.status(result.success ? 200 : result.statusCode).json(result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } });
    }
    async create(req, res, _next) {
        const result = await pets_service_1.petsService.create(req.user.id, req.body);
        return res.status(result.success ? (result.statusCode || 201) : result.statusCode).json(result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } });
    }
    async update(req, res, _next) {
        const result = await pets_service_1.petsService.update(req.user.id, req.params.id, req.body);
        return res.status(result.success ? 200 : result.statusCode).json(result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } });
    }
    async delete(req, res, _next) {
        const result = await pets_service_1.petsService.softDelete(req.user.id, req.params.id);
        return res.status(result.success ? 200 : result.statusCode).json(result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } });
    }
}
exports.PetsController = PetsController;
exports.petsController = new PetsController();
//# sourceMappingURL=pets.controller.js.map