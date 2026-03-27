import { Router, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

// ─── List Notifications ─────────────────────────
notificationsRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { unread_only = 'false', limit = '50', offset = '0' } = req.query;

        let query = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', req.user!.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });

        // Get unread count
        const { count } = await supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', req.user!.id)
            .eq('is_read', false);

        res.json({
            notifications: data,
            unread_count: count || 0,
        });
    } catch (err) {
        next(err);
    }
});

// ─── Mark As Read ───────────────────────────────
notificationsRouter.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user!.id);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Marked as read' });
    } catch (err) {
        next(err);
    }
});

// ─── Mark All As Read ───────────────────────────
notificationsRouter.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.user!.id)
            .eq('is_read', false);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
});

// ─── Delete Notification ────────────────────────
notificationsRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user!.id);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        next(err);
    }
});
