import { env } from '../config';
import { isSupabaseConfigured } from '../shared/lib/supabase';

/**
 * Run database migrations.
 * When Supabase is configured, runs DDL via the Supabase SQL executor.
 * Otherwise, runs against local PostgreSQL.
 */
export async function migrate() {
    try {
        if (isSupabaseConfigured()) {
            console.log('🔄 Running Supabase migrations & seeding...');
            await migrateSupabase();
        } else {
            console.log('🔄 Running local PostgreSQL migrations...');
            await migrateLocal();
        }
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        // Do not crash server on migration failure in production to allow partial functionality
        if (env.NODE_ENV !== 'production') throw err;
    }
}

async function migrateSupabase() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Basic sanity check - connectivity
    const { error: pingError } = await supabase.from('profiles').select('id').limit(1);
    if (pingError) {
        console.warn('  ⚠️ Cannot reach profiles table. Supabase might not be fully initialized or RLS is blocking public access.');
    }

    // 2. Automated seeding via upsert (safe for production)
    console.log('  📝 Seeding essential content...');
    await seedSiteContent(supabase);
    await seedServices(supabase);

    console.log('✅ Supabase check completed');
}

async function seedSiteContent(supabase: any) {
    const content = [
        {
            key: 'client_how_it_works',
            type: 'steps',
            is_active: true,
            content: [
                { title: 'Choose Service', description: 'Select from grooming, walking, vet visits, or boarding.', icon: 'Scissors' },
                { title: 'Pick a Pro', description: 'Browse expert profiles, ratings, and book your preferred date/time.', icon: 'Users' },
                { title: 'Relax & Track', description: 'Track the session live and pay securely via the app.', icon: 'MapPin' }
            ],
        },
        {
            key: 'provider_how_it_works',
            type: 'steps',
            is_active: true,
            content: [
                { title: 'Setup Profile', description: 'List your services, prices, and upload your certifications.', icon: 'Info' },
                { title: 'Get Requests', description: 'Receive real-time booking requests from pet parents nearby.', icon: 'Bell' },
                { title: 'Start Earning', description: 'Complete jobs, collect positive reviews, and withdraw earnings daily.', icon: 'Zap' }
            ],
        },
        {
            key: 'client_home_banners',
            type: 'banners',
            is_active: true,
            content: [
                {
                    title: 'Professional Grooming at Home',
                    subtitle: 'Get 20% off on your first spa session',
                    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&h=400',
                    action: 'bookingFlow',
                    serviceId: 'grooming'
                },
                {
                    title: 'Certified Vet Consultations',
                    subtitle: 'Talk to an expert instantly',
                    image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=800&h=400',
                    action: 'bookingFlow',
                    serviceId: 'vet'
                }
            ],
        }
    ];

    const { error } = await supabase.from('site_content').upsert(content, { onConflict: 'key' });
    if (error) {
        console.error('  ❌ site_content seed failed:', error.message);
        console.log('  💡 PRO TIP: Create the site_content table first in Supabase SQL Editor.');
    } else {
        console.log('  ✅ site_content seeded successfully');
    }
}

async function seedServices(supabase: any) {
    const services = [
        { name: 'Grooming', slug: 'grooming', description: 'Complete grooming and spa', category: 'care', is_active: true },
        { name: 'Vet Visit', slug: 'vet', description: 'Professional vet care', category: 'health', is_active: true },
        { name: 'Boarding', slug: 'boarding', description: 'Safe pet stays', category: 'stay', is_active: true },
        { name: 'Dog Walking', slug: 'walking', description: 'Daily exercise for your pet', category: 'exercise', is_active: true }
    ];

    const { error } = await supabase.from('services').upsert(services, { onConflict: 'slug' });
    if (error) {
        console.warn('  ⚠️ services seed skipped/failed:', error.message);
    } else {
        console.log('  ✅ services seeded');
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
        const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf-8') : null;
        if (sql) {
            await pool.query(sql);
            console.log('✅ Local SQL migration completed');
        }
    } catch (err: any) {
        console.error('❌ Local migration error:', err.message);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    migrate().catch(() => process.exit(1));
}
