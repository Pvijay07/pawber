"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsService = exports.EventsService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('EventsService');
class EventsService {
    async list(query) {
        let dbQuery = lib_1.supabaseAdmin
            .from('events')
            .select('*')
            .eq('is_active', true)
            .order('event_date', { ascending: true })
            .range(query.offset, query.offset + query.limit - 1);
        if (query.upcoming_only) {
            dbQuery = dbQuery.gte('event_date', new Date().toISOString());
        }
        const { data, error } = await dbQuery;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ events: data });
    }
    async getById(id) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data)
            return (0, types_1.fail)('Event not found', 404);
        const { count } = await lib_1.supabaseAdmin
            .from('event_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', id)
            .eq('status', 'valid');
        return (0, types_1.ok)({
            event: {
                ...data,
                tickets_sold: count || 0,
                spots_remaining: data.max_attendees ? data.max_attendees - (count || 0) : null,
            }
        });
    }
    async purchaseTicket(userId, eventId) {
        const { data: event } = await lib_1.supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        if (!event)
            return (0, types_1.fail)('Event not found', 404);
        const { data: existingTicket } = await lib_1.supabaseAdmin
            .from('event_tickets')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .eq('status', 'valid')
            .single();
        if (existingTicket)
            return (0, types_1.fail)('You already have a ticket', 409);
        if (event.max_attendees) {
            const { count } = await lib_1.supabaseAdmin
                .from('event_tickets')
                .select('id', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'valid');
            if ((count || 0) >= event.max_attendees)
                return (0, types_1.fail)('Event is sold out', 409);
        }
        const qrCode = `PETCARE-EVT-${eventId.slice(0, 8)}-${crypto_1.default.randomBytes(8).toString('hex').toUpperCase()}`;
        const { data: ticket, error } = await lib_1.supabaseAdmin
            .from('event_tickets')
            .insert({
            event_id: eventId,
            user_id: userId,
            qr_code: qrCode,
            status: 'valid',
        })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)('Failed to create ticket', 500);
        await lib_1.supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title: '🎟 Ticket Confirmed!',
            message: `Your ticket for "${event.title}" is ready.`,
            type: 'booking',
            data: { event_id: eventId, ticket_id: ticket.id },
        });
        return (0, types_1.ok)({ ticket });
    }
    async getMyTickets(userId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('event_tickets')
            .select('*, event:events(title, event_date, location, image_url)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ tickets: data });
    }
    async validateTicket(qrCode) {
        const { data: ticket, error } = await lib_1.supabaseAdmin
            .from('event_tickets')
            .select('*, event:events(title, event_date), user:profiles(full_name)')
            .eq('qr_code', qrCode)
            .single();
        if (error || !ticket)
            return (0, types_1.fail)('Invalid ticket', 404);
        if (ticket.status !== 'valid') {
            return (0, types_1.ok)({ valid: false, message: `Ticket is ${ticket.status}`, ticket });
        }
        await lib_1.supabaseAdmin
            .from('event_tickets')
            .update({ status: 'used' })
            .eq('id', ticket.id);
        return (0, types_1.ok)({ valid: true, message: 'Ticket validated successfully', ticket });
    }
}
exports.EventsService = EventsService;
exports.eventsService = new EventsService();
//# sourceMappingURL=events.service.js.map