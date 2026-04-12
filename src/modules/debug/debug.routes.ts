import { Router } from 'express';
import { isSupabaseConfigured } from '../../shared/lib/supabase';
import { env } from '../../config/env';

const router = Router();

function mask(v?: string) {
    if (!v) return null;
    try {
        const u = new URL(v);
        return `${u.protocol}//${u.hostname}`;
    } catch {
        return v && v.length > 8 ? `${v.slice(0, 6)}...${v.slice(-4)}` : v;
    }
}

router.get('/db', (_req, res) => {
    res.json({
        success: true,
        data: {
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            database: env.DB_NAME,
            isUsingShim: isSupabaseConfigured(),
        },
    });
});

/**
 * Debug endpoint to trace auth flow step-by-step.
 * Mimics auth middleware logic with full diagnostics.
 */
router.get('/auth-test', async (req, res) => {
    const { supabaseAdmin } = await import('../../shared/lib/supabase');
    const steps: any = {};
    
    try {
        const authHeader = req.headers.authorization;
        steps.hasAuthHeader = !!authHeader;
        steps.headerPrefix = authHeader?.substring(0, 10);
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.json({ success: false, steps, error: 'No bearer token' });
        }
        
        const token = authHeader.split(' ')[1];
        steps.tokenLength = token.length;
        steps.tokenStart = token.substring(0, 20);
        
        // Step 1: Verify token with Supabase
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        steps.getUserResult = { user: userData?.user ? { id: userData.user.id, email: userData.user.email } : null, error: userError?.message || null };
        
        if (userError || !userData?.user) {
            return res.json({ success: false, steps, error: 'Token invalid' });
        }
        
        // Step 2: Query profiles
        const userId = userData.user.id;
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, full_name')
            .eq('id', userId)
            .single();
        
        steps.profileQuery = { profile, error: profileError?.message || null };
        
        return res.json({ success: true, steps });
    } catch (err: any) {
        steps.exception = err.message;
        return res.json({ success: false, steps, error: err.message });
    }
});

export { router as debugRouter };
