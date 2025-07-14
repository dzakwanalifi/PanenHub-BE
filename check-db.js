// check-db.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkData() {
  try {
    console.log('Checking products data...');
    const { data, error } = await supabase
      .from('products')
      .select('id, title, description, price')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Products in database:');
    data.forEach(product => {
      console.log(`ID: ${product.id}`);
      console.log(`Title: ${product.title}`);
      console.log(`Description: ${product.description}`);
      console.log(`Price: ${product.price}`);
      console.log('---');
    });

    console.log('\nChecking group_buy_products...');
    const { data: groupBuyData, error: groupBuyError } = await supabase
      .from('group_buy_products')
      .select('*')
      .eq('is_active', true);

    if (groupBuyError) {
      console.error('Group Buy Error:', groupBuyError);
      return;
    }

    console.log('Active group buy products:', groupBuyData);

    // Now test the JOIN query that the API uses
    console.log('\nTesting API query...');
    const { data: joinData, error: joinError } = await supabase
      .from('products')
      .select(`
        *,
        group_buy_products!inner(
          original_price,
          group_price,
          min_participants,
          max_participants,
          current_participants,
          start_date,
          end_date,
          is_active
        )
      `)
      .eq('group_buy_products.is_active', true)
      .order('created_at', { ascending: false });

    if (joinError) {
      console.error('Join Error:', joinError);
      return;
    }

    console.log('Join query result:', joinData);

  } catch (err) {
    console.error('Script error:', err);
  }
}

checkData();
