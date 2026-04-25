import { supabaseAdmin as supabase } from '../src/shared/lib/supabase';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedAddons() {
  console.log('🐾 Seeding premium addons for all services...\n');

  // Get all services
  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .eq('is_active', true);

  if (!services) { console.error('No services found!'); return; }

  const svcMap: Record<string, string> = {};
  services.forEach((s: any) => { svcMap[s.name] = s.id; });
  console.log('Services found:', Object.keys(svcMap).join(', '));

  // Clear existing addons
  for (const svc of services) {
    await supabase.from('addons').delete().eq('service_id', svc.id);
  }
  console.log('✅ Cleared old addons\n');

  // ─── GROOMING ADDONS ────────────────────────────────────
  if (svcMap['Grooming']) {
    const { error } = await supabase.from('addons').insert([
      { service_id: svcMap['Grooming'], name: 'Tick & Flea Treatment', price: 199, duration_minutes: 15, is_active: true },
      { service_id: svcMap['Grooming'], name: 'De-matting (Heavy Knots)', price: 299, duration_minutes: 20, is_active: true },
      { service_id: svcMap['Grooming'], name: 'Teeth Cleaning & Polishing', price: 149, duration_minutes: 10, is_active: true },
      { service_id: svcMap['Grooming'], name: 'Nail Art & Painting', price: 99, duration_minutes: 10, is_active: true },
      { service_id: svcMap['Grooming'], name: 'Aromatherapy Oil Massage', price: 249, duration_minutes: 20, is_active: true },
      { service_id: svcMap['Grooming'], name: 'Pet Perfume & Bandana', price: 79, duration_minutes: 5, is_active: true },
    ]);
    console.log(error ? `❌ Grooming addons: ${error.message}` : '✅ 6 Grooming addons');
  }

  // ─── DOG WALKING ADDONS ─────────────────────────────────
  if (svcMap['Dog Walking']) {
    const { error } = await supabase.from('addons').insert([
      { service_id: svcMap['Dog Walking'], name: 'Poop Scoop & Cleanup', price: 49, duration_minutes: 5, is_active: true },
      { service_id: svcMap['Dog Walking'], name: 'Photo & Video Updates', price: 79, duration_minutes: 0, is_active: true },
      { service_id: svcMap['Dog Walking'], name: 'Basic Commands Training', price: 149, duration_minutes: 10, is_active: true },
      { service_id: svcMap['Dog Walking'], name: 'Socialization Session', price: 199, duration_minutes: 15, is_active: true },
    ]);
    console.log(error ? `❌ Walking addons: ${error.message}` : '✅ 4 Dog Walking addons');
  }

  // ─── BOARDING ADDONS ────────────────────────────────────
  if (svcMap['Boarding/Sitting']) {
    const { error } = await supabase.from('addons').insert([
      { service_id: svcMap['Boarding/Sitting'], name: 'Webcam Live Access', price: 149, duration_minutes: 0, is_active: true },
      { service_id: svcMap['Boarding/Sitting'], name: 'Gourmet Meal Upgrade', price: 199, duration_minutes: 0, is_active: true },
      { service_id: svcMap['Boarding/Sitting'], name: 'Daily Video Call', price: 99, duration_minutes: 10, is_active: true },
      { service_id: svcMap['Boarding/Sitting'], name: 'Grooming Touch-up', price: 249, duration_minutes: 30, is_active: true },
      { service_id: svcMap['Boarding/Sitting'], name: 'Playtime Extension (+2hr)', price: 149, duration_minutes: 120, is_active: true },
    ]);
    console.log(error ? `❌ Boarding addons: ${error.message}` : '✅ 5 Boarding addons');
  }

  // ─── TRAINING ADDONS ────────────────────────────────────
  if (svcMap['Training']) {
    const { error } = await supabase.from('addons').insert([
      { service_id: svcMap['Training'], name: 'Progress Report & Video', price: 199, duration_minutes: 0, is_active: true },
      { service_id: svcMap['Training'], name: 'Agility Course Session', price: 349, duration_minutes: 30, is_active: true },
      { service_id: svcMap['Training'], name: 'Trick Training Module', price: 249, duration_minutes: 20, is_active: true },
      { service_id: svcMap['Training'], name: 'Home Follow-up Visit', price: 499, duration_minutes: 45, is_active: true },
    ]);
    console.log(error ? `❌ Training addons: ${error.message}` : '✅ 4 Training addons');
  }

  // ─── VET CONSULTATION ADDONS ────────────────────────────
  if (svcMap['Vet Consultation']) {
    const { error } = await supabase.from('addons').insert([
      { service_id: svcMap['Vet Consultation'], name: 'Lab Work & Blood Test', price: 499, duration_minutes: 30, is_active: true },
      { service_id: svcMap['Vet Consultation'], name: 'Vaccination Shot', price: 349, duration_minutes: 10, is_active: true },
      { service_id: svcMap['Vet Consultation'], name: 'Deworming Treatment', price: 199, duration_minutes: 5, is_active: true },
      { service_id: svcMap['Vet Consultation'], name: 'Diet & Nutrition Plan', price: 149, duration_minutes: 15, is_active: true },
      { service_id: svcMap['Vet Consultation'], name: 'Prescription Delivery', price: 99, duration_minutes: 0, is_active: true },
    ]);
    console.log(error ? `❌ Vet addons: ${error.message}` : '✅ 5 Vet Consultation addons');
  }

  // ─── PET TAXI ADDONS ────────────────────────────────────
  if (svcMap['Pet Taxi']) {
    const { error } = await supabase.from('addons').insert([
      { service_id: svcMap['Pet Taxi'], name: 'Wait & Return (30 min)', price: 149, duration_minutes: 30, is_active: true },
      { service_id: svcMap['Pet Taxi'], name: 'Extra Distance (+10km)', price: 149, duration_minutes: 15, is_active: true },
      { service_id: svcMap['Pet Taxi'], name: 'Premium Pet Carrier', price: 99, duration_minutes: 0, is_active: true },
    ]);
    console.log(error ? `❌ Taxi addons: ${error.message}` : '✅ 3 Pet Taxi addons');
  }

  // Also add sort_order to packages (to ensure ordering)
  console.log('\n📦 Updating package sort orders...');
  for (const svc of services) {
    const { data: pkgs } = await supabase
      .from('service_packages')
      .select('id')
      .eq('service_id', svc.id)
      .order('price', { ascending: true });
    
    if (pkgs) {
      for (let i = 0; i < pkgs.length; i++) {
        await supabase.from('service_packages').update({ sort_order: i + 1 }).eq('id', pkgs[i].id);
      }
      console.log(`  ✅ ${svc.name}: ${pkgs.length} packages ordered`);
    }
  }

  console.log('\n══════════════════════════════════════════');
  console.log('🎉 27 addons seeded across all 6 services!');
  console.log('══════════════════════════════════════════\n');
}

seedAddons().catch(console.error);
