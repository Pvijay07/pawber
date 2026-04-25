import { servicesService } from './src/modules/services/services.service';
import { supabaseAdmin as supabase } from './src/shared/lib/supabase';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testApi() {
  console.log('Testing getServiceById...');
  
  // Get an active service
  const { data: svcs } = await supabase.from('services').select('id, name').eq('is_active', true).limit(1);
  if (!svcs || svcs.length === 0) {
    console.log('No services found.');
    return;
  }
  
  const testId = svcs[0].id;
  console.log('Testing with service ID:', testId, 'Name:', svcs[0].name);
  
  const result = await servicesService.getServiceById(testId);
  console.log('Result success:', result.success);
  if (result.success) {
    console.log('Has service:', !!result.data?.service);
    console.log('Packages count:', result.data?.service?.packages?.length);
    console.log('Addons count:', result.data?.service?.addons?.length);
    console.log('Full service object keys:', Object.keys(result.data?.service || {}));
  } else {
    console.error('Error:', result.error);
  }
}

testApi().catch(console.error);
