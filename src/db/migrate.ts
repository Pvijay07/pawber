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
    const isProduction = env.NODE_ENV === 'production';
    const host = env.DB_HOST || 'localhost';
    const user = env.DB_USER || 'postgres';
    const pass = env.DB_PASS || '';
    const name = env.DB_NAME || 'pawber';
    const port = env.DB_PORT || 5432;

    const connectionString = env.DATABASE_URL || `postgresql://${user}:${pass}@${host}:${port}/${name}`;
    
    // Prevent connecting to localhost in production if no DATABASE_URL is provided
    if (isProduction && !env.DATABASE_URL && host === 'localhost') {
        console.warn('  ⚠️ Skipping DDL phase: DATABASE_URL is missing and DB_HOST is localhost in production.');
        return;
    }

    console.log(`  🔌 Connecting to database for DDL: ${connectionString.split('@')[1] || 'local'}`);
    
    const pool = new Pool({
        connectionString,
        ssl: isProduction ? { rejectUnauthorized: false } : false
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
    await seedCategories(supabase);
    await seedServices(supabase);
}

async function seedCategories(supabase: any) {
    const categories = [
        { name: 'Grooming', slug: 'grooming', sort_order: 1, icon_url: 'Scissors' },
        { name: 'Veterinary', slug: 'health', sort_order: 2, icon_url: 'Heart' },
        { name: 'Boarding', slug: 'stay', sort_order: 3, icon_url: 'Home' },
        { name: 'Dog Walking', slug: 'exercise', sort_order: 4, icon_url: 'Zap' },
        { name: 'Training', slug: 'training', sort_order: 5, icon_url: 'Star' }
    ];

    const { error } = await supabase.from('service_categories').upsert(categories, { onConflict: 'slug' });
    if (error) {
        console.warn('  ⚠️ service_categories seed failed:', error.message);
    } else {
        console.log('  ✅ service_categories seeded');
    }
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
    // 1. Get categories to map slugs to IDs
    const { data: categories } = await supabase.from('service_categories').select('id, slug');
    const catMap = categories?.reduce((acc: any, cat: any) => ({ ...acc, [cat.slug]: cat.id }), {}) || {};

    const services = [
        { name: 'Grooming', slug: 'grooming', description: 'Complete grooming and spa', category_id: catMap['grooming'], is_active: true },
        { name: 'Veterinary', slug: 'vet', description: 'Professional vet care', category_id: catMap['health'], is_active: true },
        { name: 'Boarding', slug: 'boarding', description: 'Safe pet stays', category_id: catMap['stay'], is_active: true },
        { name: 'Dog Walking', slug: 'walking', description: 'Daily exercise for your pet', category_id: catMap['exercise'], is_active: true }
    ];

    // Only upsert services that have a valid category_id
    const validServices = services.filter(s => !!s.category_id);

    if (validServices.length > 0) {
        const { data: servData, error } = await supabase.from('services').upsert(validServices, { onConflict: 'slug' }).select();
        if (error) {
            console.warn('  ⚠️ services seed failed:', error.message);
        } else {
            console.log('  ✅ services seeded');
            
            // 3. Seed Packages for seeded services
            const groom = servData.find((s: any) => s.slug === 'grooming');
            const walk = servData.find((s: any) => s.slug === 'walking');
            
            if (groom) {
                await supabase.from('service_packages').upsert([
                    { service_id: groom.id, package_name: 'Basic Bath', price: 499, duration_minutes: 45, features: ['Bath', 'Nail Trimming'] },
                    { service_id: groom.id, package_name: 'Full Spa', price: 999, duration_minutes: 90, features: ['Bath', 'Haircut', 'Ear Cleaning'], is_popular: true }
                ], { onConflict: 'service_id,package_name' });
                
                await supabase.from('addons').upsert([
                    { service_id: groom.id, name: 'De-shedding', price: 299, duration_minutes: 20 },
                    { service_id: groom.id, name: 'Tick Treatment', price: 199, duration_minutes: 15 }
                ], { onConflict: 'service_id,name' });
            }

            if (walk) {
                await supabase.from('service_packages').upsert([
                    { service_id: walk.id, package_name: '30 Min Walk', price: 199, duration_minutes: 30, features: ['Exercise', 'Water Break'] },
                    { service_id: walk.id, package_name: '60 Min Walk', price: 349, duration_minutes: 60, features: ['Full Workout', 'Treats Included'] }
                ], { onConflict: 'service_id,package_name' });
            }
            
            console.log('  ✅ packages and addons seeded');
        }
    } else {
        console.warn('  ⚠️ No valid categories found for services, skipping services seed');
    }
}

// Run if called directly
if (require.main === module) {
    migrate().catch(() => process.exit(1));
}
