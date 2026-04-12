import { env } from '../config';
import { isSupabaseConfigured } from '../shared/lib/supabase';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

/**
 * Run database migrations.
 * In production, we use the postgres connection string to run DDL (tables/indices)
 * and then use the Supabase client for data seeding.
 */
export async function migrate() {
    try {
        console.log('🔄 Initiating Database Migration Strategy...');
        
        // 1. Run DDL (Tables/Schema) via raw PostgreSql connection
        await runDDL();

        // 2. Run Seeding via Supabase Client (if configured)
        if (isSupabaseConfigured()) {
            console.log('🔄 Running Supabase data seeding...');
            await migrateSupabase();
        } else {
            console.log('🔄 Running local PostgreSql seeding...');
            // Local seeding logic if needed
        }
        
        console.log('✅ Database migration and seeding successful!');
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        if (env.NODE_ENV !== 'production') throw err;
    }
}

async function runDDL() {
    const connectionString = env.DATABASE_URL || `postgresql://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
    
    console.log(`  🔌 Connecting to database for DDL: ${connectionString.split('@')[1] || 'local'}`);
    
    const pool = new Pool({
        connectionString,
        ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Find seeds.sql in dist/db folder (production) or src/db (dev)
        let sqlPath = path.join(process.cwd(), 'dist', 'db', 'seeds.sql');
        if (!fs.existsSync(sqlPath)) {
            sqlPath = path.join(__dirname, 'seeds.sql'); // Try relative to current file
        }
        if (!fs.existsSync(sqlPath)) {
            sqlPath = path.join(process.cwd(), 'src', 'db', 'seeds.sql'); // Final fallback
        }

        if (fs.existsSync(sqlPath)) {
            console.log(`  📜 Executing DDL from: ${path.basename(sqlPath)}`);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await pool.query(sql);
            console.log('  ✅ DDL execution completed successfully');
        } else {
            console.warn('  ⚠️ seeds.sql not found, skipping DDL phase');
        }
    } catch (err: any) {
        console.error('  ❌ DDL phase failed:', err.message);
        throw err;
    } finally {
        await pool.end();
    }
}

async function migrateSupabase() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('  📝 Seeding dynamic content...');
    await seedSiteContent(supabase);
    await seedServices(supabase);
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
    } else {
        console.log('  ✅ site_content seeded');
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
        console.warn('  ⚠️ services seed failed:', error.message);
    } else {
        console.log('  ✅ services seeded');
    }
}

// Run if called directly
if (require.main === module) {
    migrate().catch(() => process.exit(1));
}
