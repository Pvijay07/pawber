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

export { router as debugRouter };
