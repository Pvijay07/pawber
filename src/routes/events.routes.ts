import { Router, Response, NextFunction, Request } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import crypto from 'crypto';

export const eventsRouter = Router();

// ─── List Events (Public) ───────────────────────
eventsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { upcoming_only = 'true', limit = '20', offset = '0' } = req.query;

        let query = supabaseAdmin
            .from('events')
            .select('*')
            .eq('is_active', true)
            .order('event_date', { ascending: true })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (upcoming_only === 'true') {
            query = query.gte('event_date', new Date().toISOString());
        }

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ events: data });
    } catch (err) {
        next(err);
    }
});

// ─── Get Event Details ──────────────────────────
eventsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Event not found' });

        // Get ticket count
        const { count } = await supabaseAdmin
            .from('event_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', req.params.id)
            .eq('status', 'valid');

        res.json({
            event: {
                ...data,
                tickets_sold: count || 0,
                spots_remaining: data.max_attendees ? data.max_attendees - (count || 0) : null,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── Purchase Ticket ────────────────────────────
eventsRouter.post('/:id/purchase', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const eventId = req.params.id;

        // Get event
        const { data: event } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (!event) throw new AppError('Event not found', 404);

        // Check if already has ticket
        const { data: existingTicket } = await supabaseAdmin
            .from('event_tickets')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', req.user!.id)
            .eq('status', 'valid')
            .single();

        if (existingTicket) {
            throw new AppError('You already have a ticket for this event', 409);
        }

        // Check capacity
        if (event.max_attendees) {
            const { count } = await supabaseAdmin
                .from('event_tickets')
                .select('id', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'valid');

            if ((count || 0) >= event.max_attendees) {
                throw new AppError('Event is sold out', 409);
            }
        }

        // Generate unique QR code
        const qrCode = `PAWBER-EVT-${eventId.slice(0, 8)}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Create ticket
        const { data: ticket, error } = await supabaseAdmin
            .from('event_tickets')
            .insert({
                event_id: eventId,
                user_id: req.user!.id,
                qr_code: qrCode,
                status: 'valid',
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create ticket', 500);

        // Notification
        await supabaseAdmin.from('notifications').insert({
            user_id: req.user!.id,
            title: '🎟 Ticket Confirmed!',
            message: `Your ticket for "${event.title}" is ready. Show the QR code at the venue.`,
            type: 'booking',
            data: { event_id: eventId, ticket_id: ticket.id },
        });

        res.status(201).json({ ticket });
    } catch (err) {
        next(err);
    }
});

// ─── Get My Tickets ─────────────────────────────
eventsRouter.get('/me/tickets', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('event_tickets')
            .select('*, event:events(title, event_date, location, image_url)')
            .eq('user_id', req.user!.id)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json({ tickets: data });
    } catch (err) {
        next(err);
    }
});

// ─── Validate Ticket (for event organizers / scanners) ──
eventsRouter.post('/tickets/validate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { qr_code } = req.body;
        if (!qr_code) throw new AppError('QR code is required', 400);

        const { data: ticket, error } = await supabaseAdmin
            .from('event_tickets')
            .select('*, event:events(title, event_date), user:profiles(full_name)')
            .eq('qr_code', qr_code)
            .single();

        if (error || !ticket) return res.status(404).json({ error: 'Invalid ticket', valid: false });

        if (ticket.status === 'used') {
            return res.json({ valid: false, message: 'Ticket already used', ticket });
        }
        if (ticket.status === 'cancelled' || ticket.status === 'expired') {
            return res.json({ valid: false, message: `Ticket is ${ticket.status}`, ticket });
        }

        // Mark as used
        await supabaseAdmin
            .from('event_tickets')
            .update({ status: 'used' })
            .eq('id', ticket.id);

        res.json({ valid: true, message: 'Ticket validated successfully', ticket });
    } catch (err) {
        next(err);
    }
});
