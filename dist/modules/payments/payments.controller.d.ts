import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class PaymentsController {
    createOrder(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    verifyPayment(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    refund(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    getHistory(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const paymentsController: PaymentsController;
//# sourceMappingURL=payments.controller.d.ts.map