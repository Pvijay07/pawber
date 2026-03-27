import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { walletService } from './wallet.service';

export class WalletController {
    async get(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await walletService.getOrCreate(req.user!.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async transactions(req: AuthRequest, res: Response, _n: NextFunction) {
        const query = {
            type: req.query.type as string | undefined,
            limit: parseInt(req.query.limit as string) || 50,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const r = await walletService.getTransactions(req.user!.id, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async addFunds(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await walletService.addFunds(req.user!.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async pay(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await walletService.pay(req.user!.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }

    async autoRecharge(req: AuthRequest, res: Response, _n: NextFunction) {
        const r = await walletService.updateAutoRecharge(req.user!.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}

export const walletController = new WalletController();
