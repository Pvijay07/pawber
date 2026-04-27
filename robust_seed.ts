import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🚀 Starting Robust Seeding...');

  // 1. Categories
  const categories = [
    { id: 'eca73414-806b-44d6-b327-c5e6d84c570f', name: 'Grooming', icon_url: 'Scissors', is_active: true, sort_order: 1, slug: 'grooming' },
    { id: '3170b1d3-cca1-4ec6-b10c-957768754647', name: 'Veterinary', icon_url: 'Heart', is_active: true, sort_order: 2, slug: 'health' },
    { id: '8f003cb7-afe3-4d89-b4eb-9feba613c1e3', name: 'Boarding', icon_url: 'Home', is_active: true, sort_order: 3, slug: 'stay' },
    { id: 'ace548cb-0e2f-4db6-a6cc-d23f3c62df5f', name: 'Dog Walking', icon_url: 'Zap', is_active: true, sort_order: 4, slug: 'exercise' },
    { id: '8ca73fe2-92fe-4477-af91-9374ef3556de', name: 'Training', icon_url: 'Star', is_active: true, sort_order: 5, slug: 'training' }
  ];

  console.log('Upserting categories...');
  const { error: catError } = await supabase.from('service_categories').upsert(categories);
  if (catError) console.error('Category error:', catError);

  // 2. Services
  const services = [
    { id: uuidv4(), category_id: categories[0].id, name: 'Full Grooming', image_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800', is_active: true },
    { id: uuidv4(), category_id: categories[0].id, name: 'Bath & Brush', image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=800', is_active: true },
    { id: uuidv4(), category_id: categories[1].id, name: 'General Consultation', image_url: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=800', is_active: true },
    { id: uuidv4(), category_id: categories[3].id, name: 'Standard Walk (30 min)', image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800', is_active: true }
  ];

  console.log('Upserting services...');
  const { error: svcError } = await supabase.from('services').upsert(services);
  if (svcError) console.error('Service error:', svcError);

  // 3. Packages (Linking to first service: Full Grooming)
  const fullGroomingId = services[0].id;
  const packages = [
    { service_id: fullGroomingId, package_name: 'Basic Groom', price: 1200, duration_minutes: 60, features: ['Bath', 'Nail Trimming'] },
    { service_id: fullGroomingId, package_name: 'Premium Groom', price: 2500, duration_minutes: 120, features: ['Bath', 'Styling', 'Ear Cleaning', 'Scent'], is_popular: true },
    { service_id: fullGroomingId, package_name: 'Luxury Spa', price: 4500, duration_minutes: 180, features: ['Full Stylist', 'Massage', 'Premium Products'] }
  ];

  console.log('Inserting packages...');
  const { error: pkgError } = await supabase.from('service_packages').insert(packages);
  if (pkgError) console.error('Package error:', pkgError);

  console.log('✅ Seeding complete!');
}

seed().catch(console.error);
