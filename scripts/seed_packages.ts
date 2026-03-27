import { supabaseAdmin as supabase } from '../src/shared/lib/supabase';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  console.log('Seeding initial categories, services, and packages...');

  const { data: category, error: catErr } = await supabase
    .from('service_categories')
    .insert({
      name: 'Pawber Services',
      is_active: true,
      sort_order: 1
    })
    .select()
    .single();

  if (catErr) {
    console.error('Category error:', catErr);
    return;
  }
  
  const categoryId = category.id;

  // 1. Grooming
  const { data: groomingSvc, error: gErr } = await supabase.from('services').insert({
    name: 'Grooming',
    description: 'Spa & Grooming services',
    category_id: categoryId,
    is_active: true
  }).select().single();

  if (groomingSvc) {
    await supabase.from('service_packages').insert([
      { service_id: groomingSvc.id, package_name: 'Basic Care', price: 700, duration_minutes: 60, is_instant_available: true, is_scheduled_available: true },
      { service_id: groomingSvc.id, package_name: 'Standard Grooming', price: 800, duration_minutes: 90, is_instant_available: true, is_scheduled_available: true },
      { service_id: groomingSvc.id, package_name: 'Premium Full Grooming', price: 1499, duration_minutes: 150, is_instant_available: true, is_scheduled_available: true }
    ]);
  }

  // 2. Dog Walking
  const { data: walkingSvc } = await supabase.from('services').insert({
    name: 'Dog Walking',
    description: 'Keep your dog active and happy',
    category_id: categoryId,
    is_active: true
  }).select().single();

  if (walkingSvc) {
    await supabase.from('service_packages').insert([
      { service_id: walkingSvc.id, package_name: 'Starter Plan', price: 199, duration_minutes: 20, is_instant_available: true, is_scheduled_available: true },
      { service_id: walkingSvc.id, package_name: 'Regular Plan', price: 2499, duration_minutes: 40, is_instant_available: false, is_scheduled_available: true },
      { service_id: walkingSvc.id, package_name: 'Premium Fitness Plan', price: 4999, duration_minutes: 60, is_instant_available: false, is_scheduled_available: true }
    ]);
  }

  // 3. Boarding
  const { data: boardingSvc } = await supabase.from('services').insert({
    name: 'Boarding/Sitting',
    description: 'A home away from home',
    category_id: categoryId,
    is_active: true
  }).select().single();

  if (boardingSvc) {
    await supabase.from('service_packages').insert([
      { service_id: boardingSvc.id, package_name: 'Basic Boarding', price: 1000, duration_minutes: 1440, is_instant_available: false, is_scheduled_available: true },
      { service_id: boardingSvc.id, package_name: 'Premium Boarding', price: 1500, duration_minutes: 1440, is_instant_available: false, is_scheduled_available: true },
      { service_id: boardingSvc.id, package_name: 'Luxury Pet Stay', price: 3000, duration_minutes: 1440, is_instant_available: false, is_scheduled_available: true }
    ]);
  }

  // 4. Training
  const { data: trainingSvc } = await supabase.from('services').insert({
    name: 'Training',
    description: 'Professional obedience and behavioral training',
    category_id: categoryId,
    is_active: true
  }).select().single();

  if (trainingSvc) {
    await supabase.from('service_packages').insert([
      { service_id: trainingSvc.id, package_name: 'Basic Training', price: 4000, duration_minutes: 60, is_instant_available: false, is_scheduled_available: true },
      { service_id: trainingSvc.id, package_name: 'Behavioral Training', price: 9000, duration_minutes: 60, is_instant_available: false, is_scheduled_available: true },
      { service_id: trainingSvc.id, package_name: 'Advanced Training', price: 20000, duration_minutes: 60, is_instant_available: false, is_scheduled_available: true }
    ]);
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
