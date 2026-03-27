"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.use(auth_middleware_1.authenticate);
// ─── Get Chat Threads ───────────────────────────
exports.chatRouter.get('/threads', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('chat_threads')
            .select(`
                id, booking_id, created_at, updated_at,
                bookings:booking_id (
                    id, status,
                    service:services ( name ),
                    provider:providers ( business_name, user_id )
                ),
                last_message:chat_messages (
                    id, content, sender_id, created_at
                )
            `)
            .or(`client_id.eq.${userId},provider_user_id.eq.${userId}`)
            .order('updated_at', { ascending: false })
            .limit(1, { foreignTable: 'chat_messages' });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ threads: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Messages For a Thread ──────────────────
exports.chatRouter.get('/threads/:threadId/messages', async (req, res, next) => {
    try {
        const { threadId } = req.params;
        const { limit = '50', before } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('chat_messages')
            .select('id, thread_id, sender_id, content, message_type, metadata, is_read, created_at')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));
        if (before) {
            query = query.lt('created_at', before);
        }
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        // Mark messages as read for the current user
        await supabase_1.supabaseAdmin
            .from('chat_messages')
            .update({ is_read: true })
            .eq('thread_id', threadId)
            .neq('sender_id', req.user.id)
            .eq('is_read', false);
        res.json({ messages: (data || []).reverse() });
    }
    catch (err) {
        next(err);
    }
});
// ─── Send Message ───────────────────────────────
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
    message_type: zod_1.z.enum(['text', 'image', 'location', 'system']).default('text'),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.chatRouter.post('/threads/:threadId/messages', (0, validate_middleware_1.validate)(sendMessageSchema), async (req, res, next) => {
    try {
        const { threadId } = req.params;
        const { content, message_type, metadata } = req.body;
        // Verify the user belongs to this thread
        const { data: thread } = await supabase_1.supabaseAdmin
            .from('chat_threads')
            .select('id, client_id, provider_user_id')
            .eq('id', threadId)
            .single();
        if (!thread)
            return res.status(404).json({ error: 'Thread not found' });
        if (thread.client_id !== req.user.id && thread.provider_user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized for this thread' });
        }
        const { data: message, error } = await supabase_1.supabaseAdmin
            .from('chat_messages')
            .insert({
            thread_id: threadId,
            sender_id: req.user.id,
            content,
            message_type,
            metadata: metadata || {},
        })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        // Update thread timestamp
        await supabase_1.supabaseAdmin
            .from('chat_threads')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', threadId);
        // Send notification to the other party
        const recipientId = thread.client_id === req.user.id
            ? thread.provider_user_id
            : thread.client_id;
        await supabase_1.supabaseAdmin.from('notifications').insert({
            user_id: recipientId,
            title: '💬 New Message',
            message: content.length > 60 ? content.substring(0, 57) + '...' : content,
            type: 'chat',
            data: { thread_id: threadId },
        });
        res.status(201).json({ message });
    }
    catch (err) {
        next(err);
    }
});
// ─── Create or Get Thread for a Booking ─────────
const createThreadSchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
});
exports.chatRouter.post('/threads', (0, validate_middleware_1.validate)(createThreadSchema), async (req, res, next) => {
    try {
        const { booking_id } = req.body;
        // Get booking details
        const { data: booking } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('id, user_id, provider_id, providers:provider_id ( user_id )')
            .eq('id', booking_id)
            .single();
        if (!booking)
            return res.status(404).json({ error: 'Booking not found' });
        const providerUserId = booking.providers?.user_id;
        if (!providerUserId)
            return res.status(400).json({ error: 'No provider assigned' });
        // Check if thread already exists
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('chat_threads')
            .select('*')
            .eq('booking_id', booking_id)
            .single();
        if (existing)
            return res.json({ thread: existing });
        // Create new thread
        const { data: thread, error } = await supabase_1.supabaseAdmin
            .from('chat_threads')
            .insert({
            booking_id,
            client_id: booking.user_id,
            provider_user_id: providerUserId,
        })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        // Auto-send system message
        await supabase_1.supabaseAdmin.from('chat_messages').insert({
            thread_id: thread.id,
            sender_id: booking.user_id,
            content: 'Chat started for your booking. You can discuss service details here.',
            message_type: 'system',
        });
        res.status(201).json({ thread });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=chat.routes.js.map