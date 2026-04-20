import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { servicesService } from './services.service';

export class ServicesController {

    async listCategories(_req: Request, res: Response, _next: NextFunction) {
        const result = await servicesService.listCategories();
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async listServices(req: Request, res: Response, _next: NextFunction) {
        const categoryId = req.query.category_id as string | undefined;
        const result = await servicesService.listServices(categoryId);
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async getServiceById(req: Request, res: Response, _next: NextFunction) {
        const result = await servicesService.getServiceById(req.params.id);
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async createCategory(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.createCategory(req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async createService(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.createService(req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async createPackage(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.createPackage(req.params.serviceId, req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async createAddon(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.createAddon(req.params.serviceId, req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async updateCategory(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.updateCategory(req.params.id, req.body);
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async updateService(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.updateService(req.params.id, req.body);
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async updatePackage(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.updatePackage(req.params.id, req.body);
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async updateAddon(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await servicesService.updateAddon(req.params.id, req.body);
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async deleteItem(req: AuthRequest, res: Response, _next: NextFunction) {
        const path = req.baseUrl + req.path;
        let table = req.query.table as string;

        if (!table) {
            if (path.includes('/categories')) table = 'service_categories';
            else if (path.includes('/packages')) table = 'service_packages';
            else if (path.includes('/addons')) table = 'addons';
            else table = 'services';
        }

        const result = await servicesService.deleteItem(table, req.params.id);
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }

    async listAllPackages(_req: Request, res: Response, _next: NextFunction) {
        const result = await servicesService.listAllPackages();
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }

    async listAllAddons(_req: Request, res: Response, _next: NextFunction) {
        const result = await servicesService.listAllAddons();
        if (result.success) return res.status(200).json({ success: true, data: result.data });
        return res.status(result.statusCode).json({ success: false, error: { message: result.error || 'Operation failed' } });
    }
}

export const servicesController = new ServicesController();
