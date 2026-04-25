import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { communications } from '../shared/lib/communications';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(authorize('admin'));

// ─── Dashboard Stats ────────────────────────────
adminRouter.get('/dashboard', async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const [users, providers, bookings, revenue] = await Promise.all([
            supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('providers').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('payments').select('amount').eq('status', 'success'),
        ]);

        type Payment = { amount: number };
        const totalRevenue = revenue.data?.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0) || 0;

        // Recent bookings
        const { data: recentBookings } = await supabaseAdmin
            .from('bookings')
            .select('*, user:profiles(full_name), service:services(name)')
            .order('created_at', { ascending: false })
            .limit(10);

        // Pending providers
        const { data: pendingProviders } = await supabaseAdmin
            .from('providers')
            .select('*, user:profiles(full_name, email:id)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        res.json({
            stats: {
                total_users: users.count || 0,
                total_providers: providers.count || 0,
                total_bookings: bookings.count || 0,
                total_revenue: totalRevenue,
            },
            recent_bookings: recentBookings || [],
            pending_providers: pendingProviders || [],
        });
    } catch (err) {
        next(err);
    }
});

// ─── Demand & Supply Dashboard ──────────────────
adminRouter.get('/demand-supply', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Demand: Unfulfilled/pending bookings group by service category
        const { data: demandBookings, error: demandError } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                status,
                services ( category )
            `)
            .in('status', ['pending', 'confirmed']); // Confirmed but not started yet can also mean demand, but pending is raw demand

        // Supply: Active online SPs group by category
        const { data: supplyProviders, error: supplyError } = await supabaseAdmin
            .from('providers')
            .select('id, category, is_online, status')
            .eq('status', 'approved')
            .eq('is_online', true);

        if (demandError || supplyError) {
            return res.status(500).json({ error: 'Failed to fetch demand/supply data' });
        }

        // Aggregate Demand
        const demandMap: Record<string, number> = {};
        demandBookings?.forEach((b: any) => {
            const cat = (b.services as any)?.category || 'unknown';
            demandMap[cat] = (demandMap[cat] || 0) + 1;
        });

        // Aggregate Supply
        const supplyMap: Record<string, number> = {};
        supplyProviders?.forEach((p: any) => {
            const cat = p.category || 'unknown';
            supplyMap[cat] = (supplyMap[cat] || 0) + 1;
        });

        // Combine into a list
        const categories = Array.from(new Set([...Object.keys(demandMap), ...Object.keys(supplyMap)]));
        const dashboard = categories.map(cat => ({
            category: cat,
            demand: demandMap[cat] || 0,
            supply: supplyMap[cat] || 0,
            ratio: (supplyMap[cat] || 0) > 0 ? ((demandMap[cat] || 0) / supplyMap[cat]).toFixed(2) : 'High Demand (0 Supply)'
        }));

        res.json({ demand_supply: dashboard });
    } catch (err) {
        next(err);
    }
});

// ─── List All Users ─────────────────────────────
adminRouter.get('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { role, limit = '50', offset = '0' } = req.query;

        let query = supabaseAdmin
            .from('profiles')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (role) query = query.eq('role', role as string);

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ users: data });
    } catch (err) {
        next(err);
    }
});

// ─── List All Pets ──────────────────────────────
adminRouter.get('/pets', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { limit = '50', offset = '0' } = req.query;

        const { data, error } = await supabaseAdmin
            .from('pets')
            .select('*, owner:profiles(full_name)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ pets: data });
    } catch (err) {
        next(err);
    }
});


// ─── List All Providers ─────────────────────────
adminRouter.get('/providers', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;

        let query = supabaseAdmin
            .from('providers')
            .select('*, profiles(full_name, email, avatar_url)')
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (status) query = query.eq('status', status as string);

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ providers: data });
    } catch (err) {
        next(err);
    }
});

// ─── Approve/Reject Provider ────────────────────

const updateProviderStatusSchema = z.object({
    status: z.enum(['approved', 'rejected', 'suspended']),
});

adminRouter.patch('/providers/:id/status', validate(updateProviderStatusSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body;

        const { data, error } = await supabaseAdmin
            .from('providers')
            .update({ status })
            .eq('id', req.params.id)
            .select('*, user:profiles(id, full_name)')
            .single();

        if (error || !data) return res.status(404).json({ error: 'Provider not found' });

        // Notify provider
        await supabaseAdmin.from('notifications').insert({
            user_id: data.user.id,
            title: status === 'approved' ? '🎉 You\'re Approved!' : `Application ${status}`,
            message: status === 'approved'
                ? 'Your provider application has been approved. You can start accepting bookings!'
                : `Your provider application has been ${status}. Contact support for details.`,
            type: 'system',
        });

        res.json({ provider: data });
    } catch (err) {
        next(err);
    }
});

// ─── Verify Provider Document ───────────────────
const verifyDocSchema = z.object({
    verification_status: z.enum(['approved', 'rejected']),
});

adminRouter.patch('/documents/:id/verify', validate(verifyDocSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('provider_documents')
            .update({
                verification_status: req.body.verification_status,
                reviewed_by: req.user!.id,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !data) return res.status(404).json({ error: 'Document not found' });
        res.json({ document: data });
    } catch (err) {
        next(err);
    }
});

// ─── Update Provider Commissions ────────────────
const updateCommissionSchema = z.object({
    commission_rate: z.number().min(0).max(100),
});

adminRouter.patch('/providers/:id/commission', validate(updateCommissionSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { commission_rate } = req.body;

        const { data, error } = await supabaseAdmin
            .from('providers')
            .update({ commission_rate })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !data) return res.status(404).json({ error: 'Provider not found' });
        res.json({ provider: data });
    } catch (err) {
        next(err);
    }
});


// ─── List All Bookings ──────────────────────────
adminRouter.get('/bookings', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;

        let query = supabaseAdmin
            .from('bookings')
            .select(`
        *,
        user:profiles(full_name, phone),
        provider:providers(business_name),
        service:services(name)
      `)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (status) query = query.eq('status', status as string);

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ bookings: data });
    } catch (err) {
        next(err);
    }
});

// ─── Manage Disputes ────────────────────────────
adminRouter.get('/disputes', async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('disputes')
            .select(`
        *,
        booking:bookings(
            id, 
            total_amount, 
            status,
            service:services(name),
            provider:providers(business_name, user:profiles(avatar_url, full_name))
        ),
        raised_by_user:profiles!raised_by(full_name, avatar_url)
      `)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json({ disputes: data });

    } catch (err) {
        next(err);
    }
});

adminRouter.patch('/disputes/:id/resolve', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { resolution, status } = req.body;

        const { data, error } = await supabaseAdmin
            .from('disputes')
            .update({
                resolution,
                status: status || 'resolved',
                resolved_by: req.user!.id,
                resolved_at: new Date().toISOString(),
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !data) return res.status(404).json({ error: 'Dispute not found' });
        res.json({ dispute: data });
    } catch (err) {
        next(err);
    }
});

// ─── Manage Coupons ─────────────────────────────
adminRouter.get('/coupons', async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json({ coupons: data });
    } catch (err) {
        next(err);
    }
});

adminRouter.post('/coupons', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('coupons')
            .insert(req.body)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ coupon: data });
    } catch (err) {
        next(err);
    }
});

// ─── Create Event (Admin) ───────────────────────
adminRouter.post('/events', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('events')
            .insert({ ...req.body, organizer_id: req.user!.id })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ event: data });
    } catch (err) {
        next(err);
    }
});

// ─── Webhook Logs ───────────────────────────────
adminRouter.get('/webhook-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { source, limit = '50' } = req.query;

        let query = supabaseAdmin
            .from('webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit as string));

        if (source) query = query.eq('source', source as string);

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ logs: data });
    } catch (err) {
        next(err);
    }
});

// ─── Update Provider KYC ────────────────────────
const updateKYCSchema = z.object({
    kyc_status: z.enum(['verified', 'rejected', 'pending']),
});

adminRouter.patch('/providers/:id/kyc', validate(updateKYCSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { kyc_status } = req.body;

        const { data, error } = await supabaseAdmin
            .from('providers')
            .update({ kyc_status, kyc_reviewed_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select('*, user:profiles(id, full_name)')
            .single();

        if (error || !data) return res.status(404).json({ error: 'Provider not found' });

        // Notify provider about KYC status
        await supabaseAdmin.from('notifications').insert({
            user_id: data.user.id,
            title: kyc_status === 'verified' ? '✅ KYC Verified!' : `KYC ${kyc_status}`,
            message: kyc_status === 'verified'
                ? 'Your identity has been verified. Your trust badge is now active!'
                : 'Your KYC verification was not approved. Please resubmit your documents.',
            type: 'system',
        });

        res.json({ provider: data });
    } catch (err) {
        next(err);
    }
});

// ─── Broadcast Notification ─────────────────────
const broadcastSchema = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    channels: z.array(z.string()).optional(),
    segments: z.array(z.string()).optional(),
});

adminRouter.post('/notifications/broadcast', validate(broadcastSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, body, segments } = req.body;

        await communications.broadcastPromotion({ title, body, segments });

        res.json({ message: 'Broadcast initiated successfully' });
    } catch (err) {
        next(err);
    }
});
