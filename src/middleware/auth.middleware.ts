import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { AuthRequest, UserRole } from '../shared/types';
export { AuthRequest };

/**
 * Verifies the Supabase JWT token from Authorization header.
 * Attaches user info + role from profiles table to req.user.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: { message: 'Missing or invalid authorization header' },
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid or expired token' },
            });
        }

        // Fetch role from profiles
        let { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        // SELF-HEALING: If authenticated but profile missing, create one
        if (profileError && profileError.code === 'PGRST116' || !profile) {
            console.log(`[AUTH-LEGACY] Profile missing for ${user.email}. Attempting self-healing...`);
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    role: 'client' // default role
                })
                .select('role, full_name')
                .single();

            if (!createError) {
                console.log(`[AUTH-LEGACY] Profile auto-created for ${user.email}`);
                profile = newProfile;
                profileError = null;
            } else {
                console.error(`[AUTH-LEGACY] Self-healing failed for ${user.email}:`, createError.message);
            }
        }

        let role: UserRole = 'client';
        if (user.email === 'admin@petsfolio.com') {
            role = 'admin';
        } else if (profileError || !profile) {
            console.error('[AUTH-LEGACY] Profile lookup failed for user:', user.id, user.email, 'Error:', profileError, 'Profile:', profile);
            return res.status(403).json({
                success: false,
                error: { 
                    message: 'User profile not found. Complete onboarding first.',
                    debug: { userId: user.id, profileError: profileError?.message, hasProfile: !!profile }
                },
            });
        } else {
            role = (profile.role as UserRole) || 'client';
        }

        req.user = {
            id: user.id,
            email: user.email || '',
            role,
        };
        req.accessToken = token;

        next();
    } catch (err) {
        console.error('Auth legacy middleware error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Authentication failed' },
        });
    }
}

/**
 * Role-based access control middleware.
 */
export function authorize(...roles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient permissions',
                    required: roles,
                    current: req.user.role,
                },
            });
        }

        next();
    };
}
