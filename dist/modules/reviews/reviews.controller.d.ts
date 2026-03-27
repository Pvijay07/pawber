import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class ReviewsController {
    getByProvider(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    create(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
    reply(req: AuthRequest, res: Response, _n: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const reviewsController: ReviewsController;
//# sourceMappingURL=reviews.controller.d.ts.map