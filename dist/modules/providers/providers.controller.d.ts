import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class ProvidersController {
    list(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    register(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    updateMe(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    uploadDocument(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getMyBookings(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    addService(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getMe(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getServices(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getBookings(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getBids(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    createBid(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    listBlockedDates(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    addBlockedDate(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    removeBlockedDate(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getPerformance(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getWallet(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getTransactions(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getEvents(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const providersController: ProvidersController;
//# sourceMappingURL=providers.controller.d.ts.map