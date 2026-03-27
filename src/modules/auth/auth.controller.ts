import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { authService } from './auth.service';

export class AuthController {
    async signUp(req: Request, res: Response, _next: NextFunction) {
        const result = await authService.signUp(req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async signIn(req: Request, res: Response, _next: NextFunction) {
        const result = await authService.signIn(req.body);
        const status = result.success ? (result.statusCode || 200) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async getProfile(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await authService.getProfile(req.user!.id);
        const status = result.success ? 200 : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async updateProfile(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await authService.updateProfile(req.user!.id, req.body);
        const status = result.success ? 200 : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async refreshToken(req: Request, res: Response, _next: NextFunction) {
        const result = await authService.refreshToken(req.body.refresh_token);
        const status = result.success ? 200 : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }

    async signOut(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await authService.signOut(req.accessToken!);
        return res.status(200).json({ success: true, data: result.success ? result.data : null });
    }
}

export const authController = new AuthController();
