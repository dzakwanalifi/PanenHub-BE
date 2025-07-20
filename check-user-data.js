const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://vfbzazavjhtqpkhhgpff.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserData() {
  try {
    console.log('🔍 Checking user data in Supabase...\n');

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth.users table:\n`);

    authUsers.users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   User Metadata:`, JSON.stringify(user.user_metadata, null, 2));
      console.log(`   App Metadata:`, JSON.stringify(user.app_metadata, null, 2));
      console.log('   ---');
    });

    // Check if there's a separate users table
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*');

    if (publicError) {
      console.log('ℹ️  No public users table found or error accessing it:', publicError.message);
    } else {
      console.log(`\n📋 Found ${publicUsers.length} users in public.users table:`);
      publicUsers.forEach((user, index) => {
        console.log(`👤 User ${index + 1}:`, JSON.stringify(user, null, 2));
      });
    }

    // Check stores table to see if user is a seller
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*');

    if (storesError) {
      console.log('ℹ️  No stores table found or error accessing it:', storesError.message);
    } else {
      console.log(`\n🏪 Found ${stores.length} stores:`);
      stores.forEach((store, index) => {
        console.log(`🏪 Store ${index + 1}:`, JSON.stringify(store, null, 2));
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserData();
