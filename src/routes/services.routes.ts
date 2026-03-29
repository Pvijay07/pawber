import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

export const servicesRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Pet service catalog and categories
 */

/**
 * @swagger
 * /api/services/categories:
 *   get:
 *     summary: List all service categories
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of categories
 */
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

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: List all services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: List of services
 */
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

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service details with packages
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
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

/**
 * @swagger
 * /api/services/categories:
 *   post:
 *     summary: Create a category (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
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

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
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

/**
 * @swagger
 * /api/services/{serviceId}/packages:
 *   post:
 *     summary: Add package to service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
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

/**
 * @swagger
 * /api/services/{serviceId}/addons:
 *   post:
 *     summary: Add addon to service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
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
