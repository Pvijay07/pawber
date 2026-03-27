import crypto from 'crypto';
import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { PurchaseTicketInput, ValidateTicketInput } from './events.schema';

const log = createLogger('EventsService');

export class EventsService {

    async list(query: { upcoming_only: boolean; limit: number; offset: number }): Promise<ServiceResult<any>> {
        let dbQuery = supabaseAdmin
            .from('events')
            .select('*')
            .eq('is_active', true)
            .order('event_date', { ascending: true })
            .range(query.offset, query.offset + query.limit - 1);

        if (query.upcoming_only) {
            dbQuery = dbQuery.gte('event_date', new Date().toISOString());
        }

        const { data, error } = await dbQuery;
        if (error) return fail(error.message, 500);
        return ok({ events: data });
    }

    async getById(id: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return fail('Event not found', 404);

        const { count } = await supabaseAdmin
            .from('event_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', id)
            .eq('status', 'valid');

        return ok({
            event: {
                ...data,
                tickets_sold: count || 0,
                spots_remaining: data.max_attendees ? data.max_attendees - (count || 0) : null,
            }
        });
    }

    async purchaseTicket(userId: string, eventId: string): Promise<ServiceResult<any>> {
        const { data: event } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (!event) return fail('Event not found', 404);

        const { data: existingTicket } = await supabaseAdmin
            .from('event_tickets')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .eq('status', 'valid')
            .single();

        if (existingTicket) return fail('You already have a ticket', 409);

        if (event.max_attendees) {
            const { count } = await supabaseAdmin
                .from('event_tickets')
                .select('id', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'valid');

            if ((count || 0) >= event.max_attendees) return fail('Event is sold out', 409);
        }

        const qrCode = `PETCARE-EVT-${eventId.slice(0, 8)}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        const { data: ticket, error } = await supabaseAdmin
            .from('event_tickets')
            .insert({
                event_id: eventId,
                user_id: userId,
                qr_code: qrCode,
                status: 'valid',
            })
            .select()
            .single();

        if (error) return fail('Failed to create ticket', 500);

        await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title: '🎟 Ticket Confirmed!',
            message: `Your ticket for "${event.title}" is ready.`,
            type: 'booking',
            data: { event_id: eventId, ticket_id: ticket.id },
        });

        return ok({ ticket });
    }

    async getMyTickets(userId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('event_tickets')
            .select('*, event:events(title, event_date, location, image_url)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return fail(error.message, 500);
        return ok({ tickets: data });
    }

    async validateTicket(qrCode: string): Promise<ServiceResult<any>> {
        const { data: ticket, error } = await supabaseAdmin
            .from('event_tickets')
            .select('*, event:events(title, event_date), user:profiles(full_name)')
            .eq('qr_code', qrCode)
            .single();

        if (error || !ticket) return fail('Invalid ticket', 404);

        if (ticket.status !== 'valid') {
            return ok({ valid: false, message: `Ticket is ${ticket.status}`, ticket });
        }

        await supabaseAdmin
            .from('event_tickets')
            .update({ status: 'used' })
            .eq('id', ticket.id);

        return ok({ valid: true, message: 'Ticket validated successfully', ticket });
    }
}

export const eventsService = new EventsService();
