import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const isLocal = process.env.DB_HOST === 'localhost' || !process.env.DB_HOST;

const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function seed() {
    console.log('🚀 Starting Full Database Seeding (via PG Pool)...');

    try {
        // 1. Cleanup
        console.log('🧹 Cleaning up old catalog data...');
        await pool.query('DELETE FROM service_packages');
        await pool.query('DELETE FROM addons');
        await pool.query('DELETE FROM services');
        await pool.query('DELETE FROM service_categories');

        // 2. Categories
        console.log('📦 Seeding categories...');
        const cats = await pool.query(`
            INSERT INTO service_categories (name, slug, sort_order, icon_url) VALUES
            ('Grooming', 'grooming', 1, 'Scissors'),
            ('Health', 'health', 2, 'Heart'),
            ('Stay', 'stay', 3, 'Home'),
            ('Exercise', 'exercise', 4, 'Zap'),
            ('Training', 'training', 5, 'Star')
            RETURNING id, slug
        `);
        
        const catMap: any = {};
        cats.rows.forEach(r => catMap[r.slug] = r.id);

        // 3. Services
        console.log('🛠️ Seeding services...');
        const servs = await pool.query(`
            INSERT INTO services (category_id, name, slug, description, is_active) VALUES
            ('${catMap['grooming']}', 'Full Grooming', 'grooming', 'Professional full grooming service', true),
            ('${catMap['health']}', 'Veterinary', 'vet', 'Expert vet consultation', true),
            ('${catMap['exercise']}', 'Dog Walking', 'walking', 'Daily dog walking service', true),
            ('${catMap['stay']}', 'Boarding', 'boarding', 'Safe overnight stay', true)
            RETURNING id, slug
        `);

        const servMap: any = {};
        servs.rows.forEach(r => servMap[r.slug] = r.id);

        // 4. Packages
        console.log('🎁 Seeding packages...');
        await pool.query(`
            INSERT INTO service_packages (service_id, package_name, price, duration_minutes, features, is_popular) VALUES
            ('${servMap['grooming']}', 'Basic Bath', 499, 45, ARRAY['Bath', 'Nail Trimming'], false),
            ('${servMap['grooming']}', 'Premium Spa', 999, 90, ARRAY['Bath', 'Haircut', 'Ear Cleaning', 'Teeth Brushing'], true),
            ('${servMap['vet']}', 'General Checkup', 599, 30, ARRAY['Physical exam', 'Health report'], true),
            ('${servMap['vet']}', 'Vaccination', 899, 20, ARRAY['Single vaccine', 'Doctor fee included'], false),
            ('${servMap['walking']}', 'Quick Walk', 199, 30, ARRAY['30 mins walk', 'Water break'], false),
            ('${servMap['walking']}', 'Extended Walk', 349, 60, ARRAY['60 mins walk', 'Treats included'], true)
        `);

        // 5. Addons
        console.log('➕ Seeding addons...');
        await pool.query(`
            INSERT INTO addons (service_id, name, price, duration_minutes) VALUES
            ('${servMap['grooming']}', 'De-shedding', 299, 20),
            ('${servMap['grooming']}', 'Anti-Tick Bath', 199, 15),
            ('${servMap['walking']}', 'Extra Dog', 149, 0),
            ('${servMap['vet']}', 'Ear Cleaning Add-on', 199, 10)
        `);

        console.log('✅ Seeding completed successfully!');
    } catch (err: any) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
