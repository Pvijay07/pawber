
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://xwpmpttxooffxlqafzgd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cG1wdHR4b29mZnhscWFmemdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAxNjM1NCwiZXhwIjoyMDg3NTkyMzU0fQ.0prDWSQGBcpvUmlslMRO5iHRhMRNClq2TtlCpajmHFA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpProviders() {
    const { data: providers, error } = await supabase.from('providers').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Providers:', JSON.stringify(providers, null, 2));
    }
}

dumpProviders();
