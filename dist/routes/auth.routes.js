"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
exports.authRouter = (0, express_1.Router)();
const signUpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    full_name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['client', 'provider']).default('client'),
});
const signInSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// ─── Sign Up ────────────────────────────────────
exports.authRouter.post('/signup', (0, validate_middleware_1.validate)(signUpSchema), async (req, res, next) => {
    try {
        const { email, password, full_name, phone, role } = req.body;
        console.log('[Legacy Auth] Attempting signup for:', email);
        // Create auth user
        const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (authError) {
            console.error('[Legacy Auth] Supabase createUser error:', authError);
            return res.status(400).json({ error: authError.message });
        }
        // Create profile
        const { error: profileError } = await supabase_1.supabaseAdmin
            .from('profiles')
            .insert({
            id: authData.user.id,
            role,
            full_name,
            phone,
        });
        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return res.status(500).json({ error: 'Failed to create profile' });
        }
        // Sign in to get tokens
        const { data: session, error: signInError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });
        if (signInError) {
            return res.status(500).json({ error: 'Account created but sign-in failed. Please sign in manually.' });
        }
        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: authData.user.id,
                email,
                role,
                full_name,
            },
            session: {
                access_token: session.session?.access_token,
                refresh_token: session.session?.refresh_token,
                expires_at: session.session?.expires_at,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Sign In ────────────────────────────────────
exports.authRouter.post('/signin', (0, validate_middleware_1.validate)(signInSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Fetch profile
        const { data: profile } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('id', data.user.id)
            .single();
        res.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                role: profile?.role || 'client',
                full_name: profile?.full_name,
                avatar_url: profile?.avatar_url,
            },
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Current User ──────────────────────────
exports.authRouter.get('/me', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const { data: profile, error } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();
        if (error)
            return res.status(404).json({ error: 'Profile not found' });
        res.json({ user: profile });
    }
    catch (err) {
        next(err);
    }
});
// ─── Update Profile ─────────────────────────────
const updateProfileSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    avatar_url: zod_1.z.string().url().optional(),
});
exports.authRouter.patch('/me', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(updateProfileSchema), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('profiles')
            .update(req.body)
            .eq('id', req.user.id)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: 'Failed to update profile' });
        res.json({ user: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Refresh Token ──────────────────────────────
exports.authRouter.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'refresh_token is required' });
        }
        const { data, error } = await supabase_1.supabaseAdmin.auth.refreshSession({
            refresh_token,
        });
        if (error)
            return res.status(401).json({ error: 'Invalid refresh token' });
        res.json({
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
                expires_at: data.session?.expires_at,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Sign Out ───────────────────────────────────
exports.authRouter.post('/signout', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        await supabase_1.supabaseAdmin.auth.admin.signOut(req.accessToken);
        res.json({ message: 'Signed out successfully' });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=auth.routes.js.map