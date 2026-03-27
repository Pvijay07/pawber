import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const authRouter = Router();

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(2),
    phone: z.string().optional(),
    role: z.enum(['client', 'provider']).default('client'),
});

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// ─── Sign Up ────────────────────────────────────
authRouter.post('/signup', validate(signUpSchema), async (req, res, next) => {
    try {
        const { email, password, full_name, phone, role } = req.body;
        console.log('[Legacy Auth] Attempting signup for:', email);
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) {
            console.error('[Legacy Auth] Supabase createUser error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                role,
                full_name,
                phone,
            });

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return res.status(500).json({ error: 'Failed to create profile' });
        }

        // Sign in to get tokens
        const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
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
    } catch (err) {
        next(err);
    }
});

// ─── Sign In ────────────────────────────────────
authRouter.post('/signin', validate(signInSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Fetch profile
        const { data: profile } = await supabaseAdmin
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
    } catch (err) {
        next(err);
    }
});

// ─── Get Current User ──────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', req.user!.id)
            .single();

        if (error) return res.status(404).json({ error: 'Profile not found' });

        res.json({ user: profile });
    } catch (err) {
        next(err);
    }
});

// ─── Update Profile ─────────────────────────────
const updateProfileSchema = z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar_url: z.string().url().optional(),
});

authRouter.patch('/me', authenticate, validate(updateProfileSchema), async (req: AuthRequest, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(req.body)
            .eq('id', req.user!.id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: 'Failed to update profile' });

        res.json({ user: data });
    } catch (err) {
        next(err);
    }
});

// ─── Refresh Token ──────────────────────────────
authRouter.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'refresh_token is required' });
        }

        const { data, error } = await supabaseAdmin.auth.refreshSession({
            refresh_token,
        });

        if (error) return res.status(401).json({ error: 'Invalid refresh token' });

        res.json({
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
                expires_at: data.session?.expires_at,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── Sign Out ───────────────────────────────────
authRouter.post('/signout', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await supabaseAdmin.auth.admin.signOut(req.accessToken!);
        res.json({ message: 'Signed out successfully' });
    } catch (err) {
        next(err);
    }
});
