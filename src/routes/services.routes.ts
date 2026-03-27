import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

export const servicesRouter = Router();

// ─── List Service Categories (Public) ───────────
servicesRouter.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) return res.status(500).json({ error: error.message });
        res.json({ categories: data });
    } catch (err) {
        next(err);
    }
});

// ─── List Services (Public, optionally by category) ─
servicesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let query = supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name, icon_url)')
            .eq('is_active', true);

        if (req.query.category_id) {
            query = query.eq('category_id', req.query.category_id as string);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json({ services: data });
    } catch (err) {
        next(err);
    }
});

// ─── Get Service with Packages & Addons ─────────
servicesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { data: service, error } = await supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name)')
            .eq('id', req.params.id)
            .single();

        if (error || !service) return res.status(404).json({ error: 'Service not found' });

        // Fetch packages
        const { data: packages } = await supabaseAdmin
            .from('service_packages')
            .select('*')
            .eq('service_id', req.params.id)
            .order('sort_order');

        // Fetch addons
        const { data: addons } = await supabaseAdmin
            .from('addons')
            .select('*')
            .eq('service_id', req.params.id)
            .eq('is_active', true);

        res.json({
            service: {
                ...service,
                packages: packages || [],
                addons: addons || [],
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── Admin: Create Category ─────────────────────
servicesRouter.post('/categories', authenticate, authorize('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('service_categories')
            .insert(req.body)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ category: data });
    } catch (err) {
        next(err);
    }
});

// ─── Admin: Create Service ──────────────────────
servicesRouter.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('services')
            .insert(req.body)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ service: data });
    } catch (err) {
        next(err);
    }
});

// ─── Admin: Create Package ──────────────────────
servicesRouter.post('/:serviceId/packages', authenticate, authorize('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('service_packages')
            .insert({ ...req.body, service_id: req.params.serviceId })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ package: data });
    } catch (err) {
        next(err);
    }
});

// ─── Admin: Create Addon ────────────────────────
servicesRouter.post('/:serviceId/addons', authenticate, authorize('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('addons')
            .insert({ ...req.body, service_id: req.params.serviceId })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ addon: data });
    } catch (err) {
        next(err);
    }
});
