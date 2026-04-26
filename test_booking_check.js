
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://xwpmpttxooffxlqafzgd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cG1wdHR4b29mZnhscWFmemdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAxNjM1NCwiZXhwIjoyMDg3NTkyMzU0fQ.0prDWSQGBcpvUmlslMRO5iHRhMRNClq2TtlCpajmHFA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingCheck() {
    const service_id = 'ceb3782d-a489-4ccf-9044-332b96ad78a3'; // Grooming
    
    console.log('Fetching active bookings...');
    const { data: activeBookings, error: activeError } = await supabase
        .from('bookings')
        .select('id, status, booking_pets(pet_id)')
        .eq('service_id', service_id)
        .in('status', ['pending', 'accepted', 'confirmed', 'in_progress'])
        .is('deleted_at', null);
        
    if (activeError) {
        console.error('Error:', activeError);
    } else {
        console.log('Active Bookings:', JSON.stringify(activeBookings, null, 2));
    }
}

testBookingCheck();
