"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
exports.servicesRouter = (0, express_1.Router)();
// ─── List Service Categories (Public) ───────────
exports.servicesRouter.get('/categories', async (_req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ categories: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── List Services (Public, optionally by category) ─
exports.servicesRouter.get('/', async (req, res, next) => {
    try {
        let query = supabase_1.supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name, icon_url)')
            .eq('is_active', true);
        if (req.query.category_id) {
            query = query.eq('category_id', req.query.category_id);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ services: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Service with Packages & Addons ─────────
exports.servicesRouter.get('/:id', async (req, res, next) => {
    try {
        const { data: service, error } = await supabase_1.supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name)')
            .eq('id', req.params.id)
            .single();
        if (error || !service)
            return res.status(404).json({ error: 'Service not found' });
        // Fetch packages
        const { data: packages } = await supabase_1.supabaseAdmin
            .from('service_packages')
            .select('*')
            .eq('service_id', req.params.id)
            .order('sort_order');
        // Fetch addons
        const { data: addons } = await supabase_1.supabaseAdmin
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
    }
    catch (err) {
        next(err);
    }
});
// ─── Admin: Create Category ─────────────────────
exports.servicesRouter.post('/categories', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('service_categories')
            .insert(req.body)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ category: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Admin: Create Service ──────────────────────
exports.servicesRouter.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('services')
            .insert(req.body)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ service: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Admin: Create Package ──────────────────────
exports.servicesRouter.post('/:serviceId/packages', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('service_packages')
            .insert({ ...req.body, service_id: req.params.serviceId })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ package: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Admin: Create Addon ────────────────────────
exports.servicesRouter.post('/:serviceId/addons', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('addons')
            .insert({ ...req.body, service_id: req.params.serviceId })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ addon: data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=services.routes.js.map