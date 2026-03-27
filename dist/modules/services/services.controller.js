"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesController = exports.ServicesController = void 0;
const services_service_1 = require("./services.service");
class ServicesController {
    async listCategories(_req, res, _next) {
        const result = await services_service_1.servicesService.listCategories();
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async listServices(req, res, _next) {
        const categoryId = req.query.category_id;
        const result = await services_service_1.servicesService.listServices(categoryId);
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async getServiceById(req, res, _next) {
        const result = await services_service_1.servicesService.getServiceById(req.params.id);
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async createCategory(req, res, _next) {
        const result = await services_service_1.servicesService.createCategory(req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async createService(req, res, _next) {
        const result = await services_service_1.servicesService.createService(req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async createPackage(req, res, _next) {
        const result = await services_service_1.servicesService.createPackage(req.params.serviceId, req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async createAddon(req, res, _next) {
        const result = await services_service_1.servicesService.createAddon(req.params.serviceId, req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async updateCategory(req, res, _next) {
        const result = await services_service_1.servicesService.updateCategory(req.params.id, req.body);
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async updateService(req, res, _next) {
        const result = await services_service_1.servicesService.updateService(req.params.id, req.body);
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async updatePackage(req, res, _next) {
        const result = await services_service_1.servicesService.updatePackage(req.params.id, req.body);
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async updateAddon(req, res, _next) {
        const result = await services_service_1.servicesService.updateAddon(req.params.id, req.body);
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
    async deleteItem(req, res, _next) {
        const path = req.baseUrl + req.path;
        let table = req.query.table;
        if (!table) {
            if (path.includes('/categories'))
                table = 'service_categories';
            else if (path.includes('/packages'))
                table = 'service_packages';
            else if (path.includes('/addons'))
                table = 'addons';
            else
                table = 'services';
        }
        const result = await services_service_1.servicesService.deleteItem(table, req.params.id);
        if (result.success)
            return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
}
exports.ServicesController = ServicesController;
exports.servicesController = new ServicesController();
//# sourceMappingURL=services.controller.js.map