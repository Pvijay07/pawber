
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load env from .env file
const envPath = path.join(__dirname, '..', '.env');
const supabaseUrl = "https://xwpmpttxooffxlqafzgd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cG1wdHR4b29mZnhscWFmemdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAxNjM1NCwiZXhwIjoyMDg3NTkyMzU0fQ.0prDWSQGBcpvUmlslMRO5iHRhMRNClq2TtlCpajmHFA";

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixRoles() {
    console.log('Checking for providers with incorrect roles...');
    
    // Get all providers
    const { data: providers, error: pError } = await supabase
        .from('providers')
        .select('user_id');
        
    if (pError) {
        console.error('Error fetching providers:', pError);
        return;
    }
    
    console.log(`Found ${providers.length} providers.`);
    
    for (const p of providers) {
        const { data: profile, error: prError } = await supabase
            .from('profiles')
            .select('role, email')
            .eq('id', p.user_id)
            .single();
            
        if (prError) {
            console.error(`Error fetching profile for user ${p.user_id}:`, prError.message);
            continue;
        }
        
        if (profile.role !== 'provider') {
            console.log(`Fixing role for ${profile.email} (${p.user_id}): ${profile.role} -> provider`);
            const { error: uError } = await supabase
                .from('profiles')
                .update({ role: 'provider' })
                .eq('id', p.user_id);
                
            if (uError) {
                console.error(`Failed to update role for ${profile.email}:`, uError.message);
            } else {
                console.log(`Successfully updated role for ${profile.email}`);
            }
        } else {
            console.log(`User ${profile.email} already has correct role.`);
        }
    }
}

checkAndFixRoles();
