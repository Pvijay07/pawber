"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(auth_middleware_1.authenticate);
exports.adminRouter.use((0, auth_middleware_1.authorize)('admin'));
// ─── Dashboard Stats ────────────────────────────
exports.adminRouter.get('/dashboard', async (_req, res, next) => {
    try {
        const [users, providers, bookings, revenue] = await Promise.all([
            supabase_1.supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
            supabase_1.supabaseAdmin.from('providers').select('id', { count: 'exact', head: true }),
            supabase_1.supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }),
            supabase_1.supabaseAdmin.from('payments').select('amount').eq('status', 'success'),
        ]);
        const totalRevenue = revenue.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        // Recent bookings
        const { data: recentBookings } = await supabase_1.supabaseAdmin
            .from('bookings')
            .select('*, user:profiles(full_name), service:services(name)')
            .order('created_at', { ascending: false })
            .limit(10);
        // Pending providers
        const { data: pendingProviders } = await supabase_1.supabaseAdmin
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
    }
    catch (err) {
        next(err);
    }
});
// ─── List All Users ─────────────────────────────
exports.adminRouter.get('/users', async (req, res, next) => {
    try {
        const { role, limit = '50', offset = '0' } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (role)
            query = query.eq('role', role);
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ users: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── List All Pets ──────────────────────────────
exports.adminRouter.get('/pets', async (req, res, next) => {
    try {
        const { limit = '50', offset = '0' } = req.query;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('pets')
            .select('*, owner:profiles(full_name)')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ pets: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── List All Providers ─────────────────────────
exports.adminRouter.get('/providers', async (req, res, next) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('providers')
            .select('*, user:profiles(full_name, email, avatar_url)')
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (status)
            query = query.eq('status', status);
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ providers: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Approve/Reject Provider ────────────────────
const updateProviderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['approved', 'rejected', 'suspended']),
});
exports.adminRouter.patch('/providers/:id/status', (0, validate_middleware_1.validate)(updateProviderStatusSchema), async (req, res, next) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('providers')
            .update({ status })
            .eq('id', req.params.id)
            .select('*, user:profiles(id, full_name)')
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Provider not found' });
        // Notify provider
        await supabase_1.supabaseAdmin.from('notifications').insert({
            user_id: data.user.id,
            title: status === 'approved' ? '🎉 You\'re Approved!' : `Application ${status}`,
            message: status === 'approved'
                ? 'Your provider application has been approved. You can start accepting bookings!'
                : `Your provider application has been ${status}. Contact support for details.`,
            type: 'system',
        });
        res.json({ provider: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Verify Provider Document ───────────────────
const verifyDocSchema = zod_1.z.object({
    verification_status: zod_1.z.enum(['approved', 'rejected']),
});
exports.adminRouter.patch('/documents/:id/verify', (0, validate_middleware_1.validate)(verifyDocSchema), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('provider_documents')
            .update({
            verification_status: req.body.verification_status,
            reviewed_by: req.user.id,
            reviewed_at: new Date().toISOString(),
        })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Document not found' });
        res.json({ document: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Update Provider Commissions ────────────────
const updateCommissionSchema = zod_1.z.object({
    commission_rate: zod_1.z.number().min(0).max(100),
});
exports.adminRouter.patch('/providers/:id/commission', (0, validate_middleware_1.validate)(updateCommissionSchema), async (req, res, next) => {
    try {
        const { commission_rate } = req.body;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('providers')
            .update({ commission_rate })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Provider not found' });
        res.json({ provider: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── List All Bookings ──────────────────────────
exports.adminRouter.get('/bookings', async (req, res, next) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('bookings')
            .select(`
        *,
        user:profiles(full_name, phone),
        provider:providers(business_name),
        service:services(name)
      `)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
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
// ─── Manage Disputes ────────────────────────────
exports.adminRouter.get('/disputes', async (_req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
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
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ disputes: data });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.patch('/disputes/:id/resolve', async (req, res, next) => {
    try {
        const { resolution, status } = req.body;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('disputes')
            .update({
            resolution,
            status: status || 'resolved',
            resolved_by: req.user.id,
            resolved_at: new Date().toISOString(),
        })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Dispute not found' });
        res.json({ dispute: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Manage Coupons ─────────────────────────────
exports.adminRouter.get('/coupons', async (_req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ coupons: data });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.post('/coupons', async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('coupons')
            .insert(req.body)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ coupon: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Create Event (Admin) ───────────────────────
exports.adminRouter.post('/events', async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('events')
            .insert({ ...req.body, organizer_id: req.user.id })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ event: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Webhook Logs ───────────────────────────────
exports.adminRouter.get('/webhook-logs', async (req, res, next) => {
    try {
        const { source, limit = '50' } = req.query;
        let query = supabase_1.supabaseAdmin
            .from('webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));
        if (source)
            query = query.eq('source', source);
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ logs: data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=admin.routes.js.map