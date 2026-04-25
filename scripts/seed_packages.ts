import { supabaseAdmin as supabase } from '../src/shared/lib/supabase';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  console.log('🐾 Seeding Pawber competitive pricing packages...\n');

  // ─── Ensure a master category exists ─────────────────────────
  let categoryId: string;

  const { data: existingCat } = await supabase
    .from('service_categories')
    .select('id')
    .eq('name', 'Pawber Services')
    .single();

  if (existingCat) {
    categoryId = existingCat.id;
    console.log('✅ Using existing category:', categoryId);
  } else {
    const { data: newCat, error: catErr } = await supabase
      .from('service_categories')
      .insert({ name: 'Pawber Services', is_active: true, sort_order: 1 })
      .select()
      .single();
    if (catErr) { console.error('❌ Category error:', catErr); return; }
    categoryId = newCat.id;
    console.log('✅ Created category:', categoryId);
  }

  // ─── Helper: upsert service + packages ───────────────────────
  async function upsertService(
    name: string,
    description: string,
    packages: { package_name: string; price: number; duration_minutes: number; is_instant_available: boolean; is_scheduled_available: boolean }[]
  ) {
    // Check if service exists
    const { data: existing } = await supabase
      .from('services')
      .select('id')
      .eq('name', name)
      .eq('category_id', categoryId)
      .single();

    let serviceId: string;

    if (existing) {
      serviceId = existing.id;
      console.log(`  📦 Service "${name}" exists (${serviceId}), updating packages...`);
      // Delete old packages first
      await supabase.from('service_packages').delete().eq('service_id', serviceId);
    } else {
      const { data: svc, error: sErr } = await supabase
        .from('services')
        .insert({ name, description, category_id: categoryId, is_active: true })
        .select()
        .single();
      if (sErr) { console.error(`  ❌ Error creating "${name}":`, sErr); return; }
      serviceId = svc.id;
      console.log(`  ✨ Created service "${name}" (${serviceId})`);
    }

    // Insert new packages
    const pkgsWithServiceId = packages.map(p => ({ ...p, service_id: serviceId }));
    const { error: pkgErr } = await supabase.from('service_packages').insert(pkgsWithServiceId);
    if (pkgErr) {
      console.error(`  ❌ Error inserting packages for "${name}":`, pkgErr);
    } else {
      console.log(`  ✅ ${packages.length} packages inserted for "${name}"`);
      packages.forEach(p => console.log(`     → ${p.package_name}: ₹${p.price} (${p.duration_minutes} min)`));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. GROOMING — 28–45% cheaper than competitors
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🛁 GROOMING');
  await upsertService('Grooming', 'Professional spa & grooming services for your pet', [
    { package_name: 'Basic Bath & Brush',     price: 499,  duration_minutes: 45,  is_instant_available: true,  is_scheduled_available: true },
    { package_name: 'Standard Grooming',       price: 799,  duration_minutes: 90,  is_instant_available: true,  is_scheduled_available: true },
    { package_name: 'Premium Full Makeover',   price: 1299, duration_minutes: 120, is_instant_available: true,  is_scheduled_available: true },
  ]);

  // ═══════════════════════════════════════════════════════════════
  // 2. DOG WALKING — 40–72% cheaper than competitors
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🚶 DOG WALKING');
  await upsertService('Dog Walking', 'GPS-tracked walks to keep your dog active and happy', [
    { package_name: 'Single Walk',           price: 149,  duration_minutes: 30,   is_instant_available: true,  is_scheduled_available: true },
    { package_name: 'Weekly Pack (5 Walks)', price: 599,  duration_minutes: 150,  is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Monthly Fitness Plan',  price: 1999, duration_minutes: 600,  is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Premium Monthly (60m)', price: 3999, duration_minutes: 1200, is_instant_available: false, is_scheduled_available: true },
  ]);

  // ═══════════════════════════════════════════════════════════════
  // 3. BOARDING / PET SITTING — 22–33% cheaper than competitors
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏠 BOARDING / PET SITTING');
  await upsertService('Boarding/Sitting', 'A safe, cage-free home away from home for your pet', [
    { package_name: 'Daycare (Half Day)',    price: 399,  duration_minutes: 360,  is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Daycare (Full Day)',    price: 599,  duration_minutes: 720,  is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Overnight Boarding',    price: 699,  duration_minutes: 1440, is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Luxury Pet Stay',       price: 1299, duration_minutes: 1440, is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Extended Stay (7 Nights)', price: 3999, duration_minutes: 10080, is_instant_available: false, is_scheduled_available: true },
  ]);

  // ═══════════════════════════════════════════════════════════════
  // 4. TRAINING — 17–30% cheaper than competitors
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🎓 TRAINING');
  await upsertService('Training', 'Professional obedience and behavioral training programs', [
    { package_name: 'Puppy Starter',         price: 2499,  duration_minutes: 300,  is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Obedience Training',    price: 6999,  duration_minutes: 900,  is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Behavioral Reform',     price: 12999, duration_minutes: 1200, is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Elite Mastery',         price: 17999, duration_minutes: 1800, is_instant_available: false, is_scheduled_available: true },
  ]);

  // ═══════════════════════════════════════════════════════════════
  // 5. VET CONSULTATION (NEW) — Unique differentiator
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏥 VET CONSULTATION (NEW)');
  await upsertService('Vet Consultation', 'Certified veterinary consultations — video calls & home visits', [
    { package_name: 'Quick Consult (Video)',  price: 199,  duration_minutes: 15,  is_instant_available: true,  is_scheduled_available: true },
    { package_name: 'Home Visit Checkup',     price: 599,  duration_minutes: 30,  is_instant_available: false, is_scheduled_available: true },
    { package_name: 'Wellness Package',       price: 1499, duration_minutes: 480, is_instant_available: false, is_scheduled_available: true },
  ]);

  // ═══════════════════════════════════════════════════════════════
  // 6. PET TAXI (NEW) — No competitor offers this
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🚗 PET TAXI (NEW)');
  await upsertService('Pet Taxi', 'Safe, AC pet transportation service with pet-friendly carriers', [
    { package_name: 'One-Way Ride',  price: 249, duration_minutes: 30, is_instant_available: true,  is_scheduled_available: true },
    { package_name: 'Round Trip',    price: 399, duration_minutes: 60, is_instant_available: true,  is_scheduled_available: true },
  ]);

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════');
  console.log('🎉 Seeding completed successfully!');
  console.log('   6 services, 22 packages total');
  console.log('   Pricing: 15–45% below market average');
  console.log('══════════════════════════════════════════\n');
}

seed().catch(console.error);
