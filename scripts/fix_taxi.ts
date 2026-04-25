import { supabaseAdmin as supabase } from '../src/shared/lib/supabase';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixTaxi() {
  // Rename the "Pawber Services" category to "Pet Taxi" since that's the only service left in it
  const { data } = await supabase
    .from('service_categories')
    .update({ name: 'Pet Taxi', icon_url: '🚗', description: 'Safe AC pet transportation', sort_order: 6 })
    .eq('id', '0e8b2ada-f2b3-424b-91e4-e5abb088b1ea')
    .select();
  console.log('✅ Category renamed to Pet Taxi:', data?.[0]?.name);

  // Final verification
  const { data: cats } = await supabase.from('service_categories').select('id, name, icon_url, sort_order').eq('is_active', true).order('sort_order');
  console.log('\n📋 Final Categories:');
  cats?.forEach((c: any) => console.log(`  ${c.icon_url} ${c.name}`));

  const { data: svcs } = await supabase.from('services').select('name, category_id').eq('is_active', true);
  console.log('\n📋 Final Services:');
  svcs?.forEach((s: any) => {
    const cat = cats?.find((c: any) => c.id === s.category_id);
    console.log(`  ${s.name} → ${cat?.name || 'UNMAPPED'}`);
  });
}
fixTaxi().catch(console.error);
