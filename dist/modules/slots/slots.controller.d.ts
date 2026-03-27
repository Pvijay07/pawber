import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class SlotsController {
    getByProvider(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    lockSlot(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    releaseLock(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    bulkCreate(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    toggleBlock(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getMySlots(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const slotsController: SlotsController;
//# sourceMappingURL=slots.controller.d.ts.map