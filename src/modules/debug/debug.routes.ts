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

router.get('/supabase', (_req, res) => {
    res.json({
        success: true,
        data: {
            usingMock: !isSupabaseConfigured(),
            supabaseUrl: mask(env.SUPABASE_URL),
            hasAnonKey: Boolean(env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY !== 'placeholder'),
            hasServiceKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder'),
        },
    });
});

export { router as debugRouter };
