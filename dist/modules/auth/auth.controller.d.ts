import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
export declare class AuthController {
    signUp(req: Request, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    signIn(req: Request, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getProfile(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    updateProfile(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    refreshToken(req: Request, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
    signOut(req: AuthRequest, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map