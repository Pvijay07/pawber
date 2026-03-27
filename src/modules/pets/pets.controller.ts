import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { petsService } from './pets.service';

export class PetsController {
    async list(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await petsService.list(req.user!.id);
        return res.status(result.success ? 200 : result.statusCode).json(
            result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } }
        );
    }

    async getById(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await petsService.getById(req.user!.id, req.params.id);
        return res.status(result.success ? 200 : result.statusCode).json(
            result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } }
        );
    }

    async create(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await petsService.create(req.user!.id, req.body);
        return res.status(result.success ? (result.statusCode || 201) : result.statusCode).json(
            result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } }
        );
    }

    async update(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await petsService.update(req.user!.id, req.params.id, req.body);
        return res.status(result.success ? 200 : result.statusCode).json(
            result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } }
        );
    }

    async delete(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await petsService.softDelete(req.user!.id, req.params.id);
        return res.status(result.success ? 200 : result.statusCode).json(
            result.success ? { success: true, data: result.data } : { success: false, error: { message: result.error } }
        );
    }
}

export const petsController = new PetsController();
