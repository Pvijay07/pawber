"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.use(auth_middleware_1.authenticate);
// ─── List Notifications ─────────────────────────
exports.notificationsRouter.get('/', async (req, res, next) => {
    try {
        const { unread_only = 'false', limit = '50', offset = '0' } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        // Get unread count
        const { count } = await supabase_1.supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);
        res.json({
            notifications: data,
            unread_count: count || 0,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Mark As Read ───────────────────────────────
exports.notificationsRouter.patch('/:id/read', async (req, res, next) => {
    try {
        const { error } = await supabase_1.supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ message: 'Marked as read' });
    }
    catch (err) {
        next(err);
    }
});
// ─── Mark All As Read ───────────────────────────
exports.notificationsRouter.patch('/read-all', async (req, res, next) => {
    try {
        const { error } = await supabase_1.supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (err) {
        next(err);
    }
});
// ─── Delete Notification ────────────────────────
exports.notificationsRouter.delete('/:id', async (req, res, next) => {
    try {
        const { error } = await supabase_1.supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ message: 'Notification deleted' });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=notifications.routes.js.map