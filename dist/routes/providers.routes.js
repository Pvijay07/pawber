"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
exports.providersRouter = (0, express_1.Router)();
// ─── Public: List Approved Providers ────────────
exports.providersRouter.get('/', async (req, res, next) => {
    try {
        const { category, city, limit = '20', offset = '0' } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('providers')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('status', 'approved')
            .eq('is_online', true)
            .is('deleted_at', null)
            .order('rating', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (category)
            query = query.eq('category', category);
        if (city)
            query = query.ilike('city', `%${city}%`);
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ providers: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Public: Get Provider Details ───────────────
exports.providersRouter.get('/:id', async (req, res, next) => {
    try {
        const { data: provider, error } = await supabase_1.supabaseAdmin
            .from('providers')
            .select(`
        *,
        user:profiles(full_name, avatar_url, phone),
        provider_services(
          service:services(id, name, description),
          base_price
        ),
        reviews:reviews(id, rating, comment, created_at, user:profiles(full_name, avatar_url))
      `)
            .eq('id', req.params.id)
            .single();
        if (error || !provider)
            return res.status(404).json({ error: 'Provider not found' });
        res.json({ provider });
    }
    catch (err) {
        next(err);
    }
});
// ─── Provider: Register ─────────────────────────
const registerProviderSchema = zod_1.z.object({
    business_name: zod_1.z.string().min(2),
    category: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    address: zod_1.z.string(),
    city: zod_1.z.string(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    service_radius_km: zod_1.z.number().int().min(1).max(100).optional(),
});
exports.providersRouter.post('/register', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(registerProviderSchema), async (req, res, next) => {
    try {
        // Check if already registered
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (existing) {
            return res.status(409).json({ error: 'You are already registered as a provider' });
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('providers')
            .insert({
            ...req.body,
            user_id: req.user.id,
            status: 'pending',
        })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        // Update user role to provider
        await supabase_1.supabaseAdmin
            .from('profiles')
            .update({ role: 'provider' })
            .eq('id', req.user.id);
        res.status(201).json({ provider: data, message: 'Registration submitted for approval' });
    }
    catch (err) {
        next(err);
    }
});
// ─── Provider: Update Profile ───────────────────
exports.providersRouter.patch('/me', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('provider'), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('providers')
            .update(req.body)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Provider profile not found' });
        res.json({ provider: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Provider: Toggle Online Status ─────────────
exports.providersRouter.patch('/me/toggle-online', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('provider'), async (req, res, next) => {
    try {
        const { data: current } = await supabase_1.supabaseAdmin
            .from('providers')
            .select('is_online')
            .eq('user_id', req.user.id)
            .single();
        if (!current)
            return res.status(404).json({ error: 'Provider not found' });
        const { data, error } = await supabase_1.supabaseAdmin
            .from('providers')
            .update({ is_online: !current.is_online })
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ provider: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Provider: Upload Document ──────────────────
const uploadDocSchema = zod_1.z.object({
    document_type: zod_1.z.string(),
    file_url: zod_1.z.string().url(),
});
exports.providersRouter.post('/me/documents', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('provider'), (0, validate_middleware_1.validate)(uploadDocSchema), async (req, res, next) => {
    try {
        const { data: provider } = await supabase_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (!provider)
            return res.status(404).json({ error: 'Provider not found' });
        const { data, error } = await supabase_1.supabaseAdmin
            .from('provider_documents')
            .insert({
            ...req.body,
            provider_id: provider.id,
        })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ document: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Provider: Get My Bookings ──────────────────
exports.providersRouter.get('/me/bookings', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('provider'), async (req, res, next) => {
    try {
        const { data: provider } = await supabase_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (!provider)
            return res.json({ bookings: [] });
        const { status } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        *,
        user:profiles(full_name, phone, avatar_url),
        service:services(name),
        package:service_packages(package_name, duration_minutes),
        booking_pets(pet:pets(name, type, breed))
      `)
            .eq('provider_id', provider.id)
            .order('created_at', { ascending: false });
        if (status)
            query = query.eq('status', status);
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ bookings: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Provider: Add Service ──────────────────────
exports.providersRouter.post('/me/services', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('provider'), async (req, res, next) => {
    try {
        const { data: provider } = await supabase_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (!provider)
            return res.status(404).json({ error: 'Provider not found' });
        const { data, error } = await supabase_1.supabaseAdmin
            .from('provider_services')
            .insert({
            provider_id: provider.id,
            service_id: req.body.service_id,
            base_price: req.body.base_price,
        })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ provider_service: data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=providers.routes.js.map