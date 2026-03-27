"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const supabase_1 = require("../lib/supabase");
/**
 * Verifies the Supabase JWT token from Authorization header.
 * Attaches user info + role from profiles table to req.user.
 */
async function authenticate(req, res, next) {
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
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid or expired token' },
            });
        }
        // Fetch role from profiles
        const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single();
        if (profileError || !profile) {
            return res.status(403).json({
                success: false,
                error: { message: 'User profile not found. Complete onboarding first.' },
            });
        }
        req.user = {
            id: user.id,
            email: user.email || '',
            role: profile.role,
        };
        req.accessToken = token;
        next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Authentication failed' },
        });
    }
}
/**
 * Role-based access control middleware.
 * Usage: authorize('admin'), authorize('provider', 'admin')
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authenticated' },
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient permissions',
                    details: { required: roles, current: req.user.role },
                },
            });
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map