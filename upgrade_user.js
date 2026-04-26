
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://xwpmpttxooffxlqafzgd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cG1wdHR4b29mZnhscWFmemdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAxNjM1NCwiZXhwIjoyMDg3NTkyMzU0fQ.0prDWSQGBcpvUmlslMRO5iHRhMRNClq2TtlCpajmHFA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function upgradeUser(email) {
    console.log(`Searching for user with email: ${email}`);
    
    // Get user by email from auth
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
    
    // Update profile
    const { error: pError } = await supabase
        .from('profiles')
        .update({ role: 'provider' })
        .eq('id', user.id);
        
    if (pError) {
        console.error('Error updating profile role:', pError);
        return;
    }
    
    // Check if provider record exists
    const { data: provider, error: prError } = await supabase
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
                address: '123 Main St',
                city: 'Tech City',
                is_online: true
            });
            
        if (cError) {
            console.error('Error creating provider record:', cError);
        } else {
            console.log('Successfully created provider record.');
        }
    } else {
        console.log('Provider record already exists.');
    }
    
    console.log(`User ${email} is now a provider.`);
}

// Upgrade the likely test accounts
upgradeUser('demo@pawber.com');
upgradeUser('admin@petsfolio.com');
upgradeUser('sonykatikala@gmail.com'); // guessing email from name
