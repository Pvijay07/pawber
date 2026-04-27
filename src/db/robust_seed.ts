import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🚀 Starting Robust Seeding...');

    // 1. Categories
    const categories = [
        { name: 'Grooming', slug: 'grooming', sort_order: 1, icon_url: 'Scissors', is_active: true },
        { name: 'Veterinary', slug: 'health', sort_order: 2, icon_url: 'Heart', is_active: true },
        { name: 'Boarding', slug: 'stay', sort_order: 3, icon_url: 'Home', is_active: true },
        { name: 'Dog Walking', slug: 'exercise', sort_order: 4, icon_url: 'Zap', is_active: true },
        { name: 'Training', slug: 'training', sort_order: 5, icon_url: 'Star', is_active: true }
    ];

    console.log('📦 Seeding Categories...');
    const { data: catData, error: catError } = await supabase.from('service_categories').upsert(categories, { onConflict: 'slug' }).select();
    if (catError) {
        console.error('❌ Category seed error:', catError.message);
        return;
    }
    console.log('✅ Categories seeded:', catData.length);

    const catMap = catData.reduce((acc: any, cat: any) => ({ ...acc, [cat.slug]: cat.id }), {});

    // 2. Services
    const services = [
        { name: 'Grooming', slug: 'grooming', description: 'Complete grooming and spa for your pet', category_id: catMap['grooming'], is_active: true },
        { name: 'Veterinary', slug: 'vet', description: 'Professional vet care at your doorstep', category_id: catMap['health'], is_active: true },
        { name: 'Boarding', slug: 'boarding', description: 'Safe and comfortable pet stays', category_id: catMap['stay'], is_active: true },
        { name: 'Dog Walking', slug: 'walking', description: 'Keep your dog active and happy', category_id: catMap['exercise'], is_active: true }
    ];

    console.log('📦 Seeding Services...');
    const { data: servData, error: servError } = await supabase.from('services').upsert(services, { onConflict: 'slug' }).select();
    if (servError) {
        console.error('❌ Service seed error:', servError.message);
        return;
    }
    console.log('✅ Services seeded:', servData.length);

    // 3. Packages & Addons
    for (const service of servData) {
        console.log(`📦 Seeding Packages/Addons for ${service.name}...`);
        
        const packages = [];
        const addons = [];

        if (service.slug === 'grooming') {
            packages.push(
                { service_id: service.id, package_name: 'Basic Bath', price: 499, duration_minutes: 45, features: ['Bath', 'Nail Trimming', 'Ear Cleaning'] },
                { service_id: service.id, package_name: 'Full Spa', price: 999, duration_minutes: 90, features: ['Bath', 'Haircut', 'Massage', 'Scented Spray'], is_popular: true }
            );
            addons.push(
                { service_id: service.id, name: 'De-shedding', price: 299, duration_minutes: 20 },
                { service_id: service.id, name: 'Tick Treatment', price: 199, duration_minutes: 15 }
            );
        } else if (service.slug === 'walking') {
            packages.push(
                { service_id: service.id, package_name: '30 Min Walk', price: 199, duration_minutes: 30, features: ['GPS Tracked', 'Water Break'] },
                { service_id: service.id, package_name: '60 Min Walk', price: 349, duration_minutes: 60, features: ['Full Exercise', 'Playtime Included'], is_popular: true }
            );
        } else if (service.slug === 'vet') {
            packages.push(
                { service_id: service.id, package_name: 'General Checkup', price: 599, duration_minutes: 30, features: ['Physical Exam', 'Health Card'] },
                { service_id: service.id, package_name: 'Full Consultation', price: 1200, duration_minutes: 60, features: ['Exam', 'Vaccination Check', 'Diet Plan'], is_popular: true }
            );
        } else {
            packages.push(
                { service_id: service.id, package_name: 'Standard Stay', price: 799, duration_minutes: 1440, features: ['Meals Included', 'Playtime'] }
            );
        }

        if (packages.length > 0) {
            const { error: pError } = await supabase.from('service_packages').upsert(packages, { onConflict: 'service_id,package_name' });
            if (pError) console.warn(`  ⚠️ Package seed warning for ${service.name}:`, pError.message);
        }
        if (addons.length > 0) {
            const { error: aError } = await supabase.from('addons').upsert(addons, { onConflict: 'service_id,name' });
            if (aError) console.warn(`  ⚠️ Addon seed warning for ${service.name}:`, aError.message);
        }
    }

    // 4. Site Content (Banners)
    console.log('📦 Seeding Site Content...');
    const content = [
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
            ]
        }
    ];

    const { error: contentError } = await supabase.from('site_content').upsert(content, { onConflict: 'key' });
    if (contentError) {
        console.error('❌ Content seed error:', contentError.message);
    } else {
        console.log('✅ Site content seeded');
    }

    console.log('✨ Seeding Completed Successfully!');
}

seed().catch(err => {
    console.error('💥 Seeding crashed:', err);
    process.exit(1);
});
