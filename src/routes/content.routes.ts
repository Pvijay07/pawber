import { Router, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

export const contentRouter = Router();

/**
 * @route   GET /api/content/homepage
 * @desc    Get dynamic homepage content (banners, steps, etc.)
 * @access  Public
 */
contentRouter.get('/homepage', async (_req: any, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .select('key, content, type')
            .eq('is_active', true);

        if (error) return res.status(500).json({ error: error.message });

        // Map keys to object for easier consumption
        const content = data.reduce((acc: any, item: any) => {
            acc[item.key] = item.content;
            return acc;
        }, {});

        res.json({ content });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/content/config
 * @desc    Get global app configurations
 * @access  Public
 */
contentRouter.get('/config', async (_req: any, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .select('key, content')
            .eq('type', 'config')
            .eq('is_active', true);

        if (error) return res.status(500).json({ error: error.message });

        const config = data.reduce((acc: any, item: any) => {
            acc[item.key] = item.content;
            return acc;
        }, {});

        res.json({ config });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/content/:key
 * @desc    Update specific content block (Admin only)
 * @access  Private (Admin)
 */
// Note: Keeping it simple for now, standard admin middleware can be added later
contentRouter.patch('/:key', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Simple role check (assumes admin role)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user!.id)
            .single();

        if (profile?.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
        }

        const { content } = req.body;
        const { data, error } = await supabaseAdmin
            .from('site_content')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('key', req.params.key)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Content updated successfully', data });
    } catch (err) {
        next(err);
    }
});
