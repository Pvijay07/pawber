import { supabaseAdmin as supabase } from '../src/shared/lib/supabase';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  console.log('\n📋 CATEGORIES:');
  const { data: cats } = await supabase.from('service_categories').select('*');
  console.table(cats);

  console.log('\n📋 SERVICES:');
  const { data: svcs } = await supabase.from('services').select('id, name, category_id, is_active');
  console.table(svcs);

  console.log('\n📋 PACKAGES:');
  const { data: pkgs } = await supabase.from('service_packages').select('id, service_id, package_name, price');
  console.table(pkgs);
}
check().catch(console.error);
