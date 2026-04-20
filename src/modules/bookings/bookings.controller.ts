import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { bookingsService } from './bookings.service';
import { CancelBookingInput, ListBookingsQuery, UpdateBookingStatusInput } from './bookings.schema';

/**
 * Bookings Controller — thin HTTP adapter.
 * Extracts data from request, calls service, sends response.
 * NO business logic here.
 */
export class BookingsController {

    async create(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await bookingsService.create(req.user!.id, req.body);
        if (result.success) {
            return res.status(result.statusCode || 201).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }

    async list(req: AuthRequest, res: Response, _next: NextFunction) {
        const query: ListBookingsQuery = {
            status: req.query.status as string | undefined,
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
        };
        const result = await bookingsService.listByUser(req.user!.id, query);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }

    async getById(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await bookingsService.getById(req.user!.id, req.params.id);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }

    async cancel(req: AuthRequest, res: Response, _next: NextFunction) {
        const input: CancelBookingInput = { reason: req.body.reason };
        const result = await bookingsService.cancel(req.user!.id, req.params.id, input);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }

    async updateStatus(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await bookingsService.updateStatus(req.params.id, req.body.status);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }

    async accept(req: AuthRequest, res: Response, _next: NextFunction) {
        // Find provider profile for this user
        const { data: provider } = await supabaseAdmin.from('providers').select('id').eq('user_id', req.user!.id).single();
        if (!provider) return res.status(404).json({ success: false, error: { message: 'Provider profile not found' } });

        const result = await bookingsService.acceptBooking(provider.id, req.params.id);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }

    async confirm(req: AuthRequest, res: Response, _next: NextFunction) {
        const result = await bookingsService.confirmPayment(req.params.id);
        if (result.success) {
            return res.status(200).json({ success: true, data: result.data });
        }
        return res.status(result.statusCode).json({ success: false, error: { message: result.error } });
    }
}

import { supabaseAdmin } from '../../shared/lib';

export const bookingsController = new BookingsController();
