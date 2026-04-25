import { supabaseAdmin as supabase } from '../src/shared/lib/supabase';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fix() {
  console.log('🔧 Fixing service-category mapping...\n');

  // ─── Step 1: Get all existing categories ────────────────────
  const { data: categories } = await supabase
    .from('service_categories')
    .select('*')
    .order('sort_order');

  console.log('📋 Existing categories:');
  categories?.forEach((c: any) => console.log(`  ${c.name} → ${c.id}`));

  // Build a lookup map
  const catMap: Record<string, string> = {};
  categories?.forEach((c: any) => {
    const name = c.name.toLowerCase();
    if (name.includes('groom'))  catMap['grooming'] = c.id;
    if (name.includes('vet'))    catMap['vet'] = c.id;
    if (name.includes('walk'))   catMap['walking'] = c.id;
    if (name.includes('board'))  catMap['boarding'] = c.id;
    if (name.includes('train')) catMap['training'] = c.id;
  });

  // ─── Step 2: Add missing categories for new services ────────
  // We need categories for Vet Consultation, Pet Taxi, Training
  if (!catMap['vet']) {
    const { data } = await supabase.from('service_categories')
      .insert({ name: 'Vet Care', icon: '🏥', is_active: true, description: 'Veterinary consultations & wellness', sort_order: 6 })
      .select().single();
    if (data) { catMap['vet'] = data.id; console.log(`  ✨ Created "Vet Care" category`); }
  }

  if (!catMap['training']) {
    const { data } = await supabase.from('service_categories')
      .insert({ name: 'Pet Training', icon: '🎓', is_active: true, description: 'Obedience and behavior training', sort_order: 7 })
      .select().single();
    if (data) { catMap['training'] = data.id; console.log(`  ✨ Created "Pet Training" category`); }
  }

  // Check if Pet Taxi category exists
  const existingTaxi = categories?.find((c: any) => c.name.toLowerCase().includes('taxi'));
  if (existingTaxi) {
    catMap['taxi'] = existingTaxi.id;
  } else {
    const { data: taxiCat } = await supabase.from('service_categories')
      .insert({ name: 'Pet Taxi', icon: '🚗', is_active: true, description: 'Safe AC pet transportation', sort_order: 8 })
      .select().single();
    if (taxiCat) { catMap['taxi'] = taxiCat.id; console.log(`  ✨ Created "Pet Taxi" category`); }
  }

  console.log('\n🗺️ Category mapping:', catMap);

  // ─── Step 3: Re-assign new services to proper categories ────
  const serviceMapping: Record<string, string> = {
    'Grooming':         catMap['grooming'],
    'Dog Walking':      catMap['walking'],
    'Boarding/Sitting': catMap['boarding'],
    'Training':         catMap['training'],
    'Vet Consultation': catMap['vet'],
    'Pet Taxi':         catMap['taxi'],
  };

  const pawberCatId = categories?.find((c: any) => c.name === 'Pawber Services')?.id;

  for (const [serviceName, targetCatId] of Object.entries(serviceMapping)) {
    if (!targetCatId) {
      console.log(`  ⚠️ No category found for "${serviceName}", skipping`);
      continue;
    }

    const { data, error } = await supabase
      .from('services')
      .update({ category_id: targetCatId })
      .eq('name', serviceName)
      .eq('category_id', pawberCatId)
      .select('id, name');

    if (data && data.length > 0) {
      console.log(`  ✅ "${serviceName}" → category ${targetCatId}`);
    } else {
      console.log(`  ⚠️ Could not update "${serviceName}":`, error?.message || 'not found under Pawber Services');
    }
  }

  // ─── Step 4: Delete old orphaned services (null category) ───
  console.log('\n🧹 Cleaning orphaned old services (null category_id)...');
  const { data: orphans } = await supabase
    .from('services')
    .select('id, name')
    .is('category_id', null);

  if (orphans && orphans.length > 0) {
    for (const orphan of orphans) {
      // Delete their packages first
      await supabase.from('service_packages').delete().eq('service_id', orphan.id);
      await supabase.from('services').delete().eq('id', orphan.id);
      console.log(`  🗑️ Removed orphaned service: "${orphan.name}" (${orphan.id})`);
    }
  } else {
    console.log('  No orphans found.');
  }

  // ─── Step 5: Delete the umbrella "Pawber Services" category ─
  // Check if any services are still using it
  const { data: remainingInPawber } = await supabase
    .from('services')
    .select('id')
    .eq('category_id', pawberCatId);

  if (!remainingInPawber || remainingInPawber.length === 0) {
    await supabase.from('service_categories').delete().eq('id', pawberCatId);
    console.log('\n🗑️ Removed empty "Pawber Services" umbrella category');
  } else {
    console.log(`\n⚠️ "Pawber Services" still has ${remainingInPawber.length} services, keeping it.`);
  }

  // ─── Final verification ─────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('📋 FINAL STATE:');
  const { data: finalCats } = await supabase.from('service_categories').select('id, name, icon').eq('is_active', true).order('sort_order');
  console.log('\nCategories:');
  finalCats?.forEach((c: any) => console.log(`  ${c.icon || '•'} ${c.name} (${c.id})`));

  const { data: finalSvcs } = await supabase.from('services').select('name, category_id, is_active').eq('is_active', true);
  console.log('\nServices:');
  finalSvcs?.forEach((s: any) => {
    const cat = finalCats?.find((c: any) => c.id === s.category_id);
    console.log(`  ${s.name} → ${cat?.name || 'UNMAPPED!'}`);
  });

  console.log('\n🎉 Fix complete!');
}

fix().catch(console.error);
