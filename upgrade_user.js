
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://xwpmpttxooffxlqafzgd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cG1wdHR4b29mZnhscWFmemdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAxNjM1NCwiZXhwIjoyMDg3NTkyMzU0fQ.0prDWSQGBcpvUmlslMRO5iHRhMRNClq2TtlCpajmHFA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function upgradeUser(email) {
    console.log(`\n--- Upgrading: ${email} ---`);
    
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) {
        console.error('Error listing users:', uError);
        return;
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`User ${email} not found in Auth.`);
        return;
    }
    
    console.log(`Found user ${user.id}. Updating role to provider...`);
    
    const { error: pError } = await supabase
        .from('profiles')
        .update({ role: 'provider' })
        .eq('id', user.id);
        
    if (pError) console.error('Error updating profile role:', pError);
    
    const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
    if (!provider) {
        console.log('Creating provider record...');
        const { error: cError } = await supabase
            .from('providers')
            .insert({
                user_id: user.id,
                business_name: user.user_metadata?.full_name || email.split('@')[0],
                category: 'Pet Care',
                address: 'Pawber Pro Office',
                city: 'Global',
                is_online: true,
                status: 'approved',
                rating: 5.0
            });
            
        if (cError) {
            console.error('Error creating provider record:', cError);
        } else {
            console.log('Successfully created provider record.');
        }
    } else {
        console.log('Provider record already exists.');
    }
}

async function run() {
    const emails = [
        'demo@pawber.com',
        'demo1@pawber.com',
        'testuser@pawber.com',
        'jspvip07@gmail.com',
        'admin@petsfolio.com'
    ];
    
    for (const email of emails) {
        await upgradeUser(email);
    }
    process.exit(0);
}

run();
