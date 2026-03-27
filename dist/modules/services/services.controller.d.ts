import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class ServicesController {
    listCategories(_req: Request, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    listServices(req: Request, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getServiceById(req: Request, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    createCategory(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    createService(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    createPackage(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    createAddon(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    updateCategory(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    updateService(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    updatePackage(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    updateAddon(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    deleteItem(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const servicesController: ServicesController;
//# sourceMappingURL=services.controller.d.ts.map