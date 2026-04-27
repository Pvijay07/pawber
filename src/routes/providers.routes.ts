import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const providersRouter = Router();

// ─── Public: List Approved Providers ────────────
providersRouter.get('/', async (req, res, next) => {
    try {
        const { category, city, limit = '20', offset = '0' } = req.query;

        let query = supabaseAdmin
            .from('providers')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('status', 'approved')
            .eq('is_online', true)
            .is('deleted_at', null)
            .order('rating', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (category) query = query.eq('category', category as string);
        if (city) query = query.ilike('city', `%${city}%`);

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ providers: data });
    } catch (err) {
        next(err);
    }
});

// ─── Public: Get Provider Details ───────────────
providersRouter.get('/:id', async (req, res, next) => {
    try {
        const { data: provider, error } = await supabaseAdmin
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

        if (error || !provider) return res.status(404).json({ error: 'Provider not found' });
        res.json({ provider });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Register ─────────────────────────
const registerProviderSchema = z.object({
    business_name: z.string().min(2),
    category: z.string(),
    description: z.string().optional(),
    address: z.string(),
    city: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    service_radius_km: z.number().int().min(1).max(100).optional(),
});

providersRouter.post('/register', authenticate, validate(registerProviderSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Check if already registered
        const { data: existing } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'You are already registered as a provider' });
        }

        const { data, error } = await supabaseAdmin
            .from('providers')
            .insert({
                ...req.body,
                user_id: req.user!.id,
                status: 'pending',
            })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });

        // Update user role to provider
        await supabaseAdmin
            .from('profiles')
            .update({ role: 'provider' })
            .eq('id', req.user!.id);

        res.status(201).json({ provider: data, message: 'Registration submitted for approval' });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Update Profile ───────────────────
providersRouter.patch('/me', authenticate, authorize('provider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('providers')
            .update(req.body)
            .eq('user_id', req.user!.id)
            .select()
            .single();

        if (error || !data) return res.status(404).json({ error: 'Provider profile not found' });
        res.json({ provider: data });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Toggle Online Status ─────────────
providersRouter.patch('/me/toggle-online', authenticate, authorize('provider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: current } = await supabaseAdmin
            .from('providers')
            .select('is_online')
            .eq('user_id', req.user!.id)
            .single();

        if (!current) return res.status(404).json({ error: 'Provider not found' });

        const { data, error } = await supabaseAdmin
            .from('providers')
            .update({ is_online: !current.is_online })
            .eq('user_id', req.user!.id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json({ provider: data });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Upload Document ──────────────────
const uploadDocSchema = z.object({
    document_type: z.string(),
    file_url: z.string().url(),
});

providersRouter.post('/me/documents', authenticate, authorize('provider'), validate(uploadDocSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) return res.status(404).json({ error: 'Provider not found' });

        const { data, error } = await supabaseAdmin
            .from('provider_documents')
            .insert({
                ...req.body,
                provider_id: provider.id,
            })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ document: data });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Get My Bookings ──────────────────
providersRouter.get('/me/bookings', authenticate, authorize('provider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) return res.json({ bookings: [] });

        const { status } = req.query;
        let query = supabaseAdmin
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

        if (status) query = query.eq('status', status as string);

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ bookings: data });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Get Booking Details ──────────────
providersRouter.get('/me/bookings/:id', authenticate, authorize('provider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) return res.status(404).json({ error: 'Provider not found' });

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                user:profiles(full_name, phone, avatar_url),
                service:services(name, description, image_url),
                package:service_packages(package_name, price, duration_minutes),
                booking_pets(pet:pets(id, name, type, breed, image_url)),
                booking_addons(addon:addons(id, name, duration_minutes), price)
            `)
            .eq('id', req.params.id)
            .eq('provider_id', provider.id)
            .single();

        if (error || !booking) return res.status(404).json({ error: 'Booking not found or not assigned to you' });
        res.json({ booking });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Add Service ──────────────────────
providersRouter.post('/me/services', authenticate, authorize('provider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) return res.status(404).json({ error: 'Provider not found' });

        const { data, error } = await supabaseAdmin
            .from('provider_services')
            .insert({
                provider_id: provider.id,
                service_id: req.body.service_id,
                base_price: req.body.base_price,
            })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ provider_service: data });
    } catch (err) {
        next(err);
    }
});
