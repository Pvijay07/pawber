import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class WalletController {
    get(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    transactions(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    addFunds(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    pay(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    autoRecharge(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const walletController: WalletController;
//# sourceMappingURL=wallet.controller.d.ts.map