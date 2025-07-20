const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://vfbzazavjhtqpkhhgpff.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSellerStatus() {
  try {
    console.log('🔄 Updating seller status for users with stores...\n');

    // Get all stores with owner information
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('owner_id');

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      return;
    }

    // Get unique owner IDs
    const ownerIds = [...new Set(stores.map(store => store.owner_id))];
    console.log(`📊 Found ${ownerIds.length} unique store owners:`, ownerIds);

    // Update each owner's user_metadata to include is_seller: true
    for (const ownerId of ownerIds) {
      console.log(`🔄 Updating user ${ownerId}...`);
      
      // Get current user data
      const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(ownerId);
      
      if (getUserError) {
        console.error(`Error getting user ${ownerId}:`, getUserError);
        continue;
      }

      // Update user metadata
      const updatedMetadata = {
        ...userData.user.user_metadata,
        is_seller: true
      };

      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        ownerId,
        {
          user_metadata: updatedMetadata
        }
      );

      if (updateError) {
        console.error(`Error updating user ${ownerId}:`, updateError);
      } else {
        console.log(`✅ Successfully updated user ${ownerId} as seller`);
      }
    }

    console.log('\n🎉 Seller status update completed!');

  } catch (error) {
    console.error('Error:', error);
  }
}

updateSellerStatus();
