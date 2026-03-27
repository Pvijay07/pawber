import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class PetsController {
    list(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    create(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    update(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    delete(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const petsController: PetsController;
//# sourceMappingURL=pets.controller.d.ts.map