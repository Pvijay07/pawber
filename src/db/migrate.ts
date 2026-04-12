import { env } from '../config';
import { isSupabaseConfigured } from '../shared/lib/supabase';

/**
 * Run database migrations.
 * When Supabase is configured, runs DDL via the Supabase SQL executor.
 * Otherwise, runs against local PostgreSQL.
 */
export async function migrate() {
    if (isSupabaseConfigured()) {
        console.log('🔄 Running Supabase migrations...');
        await migrateSupabase();
    } else {
        console.log('🔄 Running local PostgreSQL migrations...');
        await migrateLocal();
    }
}

async function migrateSupabase() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // ─── Ensure site_content table exists ────────────────
    // Since we can't run DDL via PostgREST, we check if the table exists
    // by trying to query it. If it fails with 404, we skip.
    try {
        const { error } = await supabase.from('site_content').select('key').limit(1);
        if (error && error.message?.includes('does not exist')) {
            console.log('⚠️  site_content table missing. Please create it via Supabase Dashboard SQL Editor:');
            console.log(`
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    type TEXT DEFAULT 'content',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.site_content DISABLE ROW LEVEL SECURITY;
            `);
        } else if (!error) {
            console.log('  ✅ site_content table exists');
            // Seed default content if empty
            const { data: existing } = await supabase.from('site_content').select('key').limit(1);
            if (!existing || existing.length === 0) {
                console.log('  📝 Seeding default homepage content...');
                await seedSiteContent(supabase);
            }
        }
    } catch (err: any) {
        console.error('  ⚠️  site_content check failed:', err.message);
    }

    // ─── Verify critical tables exist ────────────────────
    const tables = ['profiles', 'pets', 'wallets', 'services', 'bookings'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`  ❌ Table "${table}" check failed:`, error.message);
        } else {
            console.log(`  ✅ ${table} table OK`);
        }
    }

    console.log('✅ Supabase migration check completed');
}

async function seedSiteContent(supabase: any) {
    const content = [
        {
            key: 'hero_banner',
            type: 'content',
            is_active: true,
            content: {
                title: 'Premium Pet Care',
                subtitle: 'Professional services for your furry friends',
                cta_text: 'Book Now',
                image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
            },
        },
        {
            key: 'how_it_works',
            type: 'content',
            is_active: true,
            content: {
                title: 'How It Works',
                steps: [
                    { step: 1, title: 'Choose Service', description: 'Pick from grooming, vet, boarding & more', icon: 'Scissors' },
                    { step: 2, title: 'Select Provider', description: 'Browse verified professionals near you', icon: 'Users' },
                    { step: 3, title: 'Book & Pay', description: 'Secure booking with wallet or card', icon: 'CreditCard' },
                    { step: 4, title: 'Track Live', description: 'Real-time updates on your pet\'s service', icon: 'MapPin' },
                ],
            },
        },
        {
            key: 'expert_guide',
            type: 'content',
            is_active: true,
            content: {
                title: 'Expert Pet Guide',
                articles: [
                    { title: 'Grooming Tips', description: 'Keep your pet looking their best', icon: 'Sparkles' },
                    { title: 'Health Checkup Guide', description: 'When to visit the vet', icon: 'Heart' },
                    { title: 'Training Basics', description: 'Build good habits early', icon: 'GraduationCap' },
                ],
            },
        },
        {
            key: 'app_config',
            type: 'config',
            is_active: true,
            content: {
                support_email: 'support@pawber.com',
                support_phone: '+91 98765 43210',
                min_wallet_topup: 100,
                max_wallet_topup: 10000,
            },
        },
    ];

    const { error } = await supabase.from('site_content').upsert(content, { onConflict: 'key' });
    if (error) {
        console.error('  ❌ Seed failed:', error.message);
    } else {
        console.log('  ✅ Default content seeded');
    }
}

async function migrateLocal() {
    const fs = await import('fs');
    const path = await import('path');
    const { Pool } = await import('pg');

    const pool = new Pool({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASS,
        database: env.DB_NAME,
    });

    try {
        const sqlPath = path.join(__dirname, 'migration.sql');
        if (!fs.existsSync(sqlPath)) {
            console.log('⚠️  No migration.sql found, skipping...');
            return;
        }
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        await pool.query(sql);
        console.log('✅ Local migration completed');
    } catch (err: any) {
        console.error('❌ Migration error:', err.message);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    migrate().catch(() => process.exit(1));
}
