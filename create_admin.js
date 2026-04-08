const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE config");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'admin@petsfolio.com';
  const password = 'Password123!';
  
  console.log(`Creating user ${email}...`);
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId;
  if (error) {
    if (error.message.includes('already been registered')) {
       console.log('User already exists in auth.users, trying to find them...');
       // Unfortunately we can't easily query auth.users by email directly, you can list users
       const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
       const u = listData?.users.find(u => u.email === email);
       if (u) {
          userId = u.id;
          console.log('Found user id: ' + userId);
       } else {
          console.error("Could not find existing user id");
          process.exit(1);
       }
    } else {
       console.error("Auth error:", error);
       process.exit(1);
    }
  } else {
    userId = data.user.id;
    console.log(`User created with id ${userId}`);
  }

  console.log("Upserting profile as admin...");
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: 'System Admin',
      role: 'admin',
      onboarded: true,
      updated_at: new Date().toISOString()
    })
    .select();

  if (profileError) {
     console.error("Profile Error:", profileError);
  } else {
     console.log("Success! Admin user ready.");
  }
}

main();
