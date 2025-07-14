// Script to update product prices from USD to IDR
// Run this with: node scripts/update-product-prices.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateProductPrices() {
  console.log('🔧 Updating product prices from USD to IDR...');

  try {
    // First, get all products with low prices (likely USD)
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .lt('price', 100); // Products with price less than 100 (likely USD)

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${products.length} products with USD pricing`);

    // Update each product with IDR pricing
    const priceMapping = {
      'Organic Carrots': 15000,      // was 2.99 USD
      'Fresh Spinach': 12000,        // was 3.49 USD  
      'Organic Tomatoes': 18000,     // was 3.99 USD
      'Fresh Strawberries': 45000,   // was 5.99 USD
      'Red Bell Peppers': 25000,     // was 4.99 USD
      'Fresh Broccoli': 16000,       // was 2.79 USD
      'Purple Eggplant': 14000,      // was 3.29 USD
      'Organic Lettuce': 8000        // was 2.49 USD
    };

    for (const product of products) {
      let newPrice;
      
      if (priceMapping[product.title]) {
        newPrice = priceMapping[product.title];
      } else {
        // Fallback: convert USD to IDR (approximate rate: 1 USD = 15,000 IDR)
        newPrice = Math.round(product.price * 15000);
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', product.id);

      if (updateError) {
        console.error(`Error updating ${product.title}:`, updateError);
      } else {
        console.log(`✅ Updated ${product.title}: $${product.price} → Rp ${newPrice.toLocaleString()}`);
      }
    }

    // Verify the updates
    console.log('\n🔍 Checking updated prices...');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('title, price, unit')
      .limit(10);

    if (verifyError) {
      throw verifyError;
    }

    console.log('\nUpdated Product Prices:');
    updatedProducts.forEach(product => {
      console.log(`- ${product.title}: Rp ${product.price.toLocaleString()}/${product.unit}`);
    });

    console.log('\n✅ Price update completed!');

  } catch (error) {
    console.error('❌ Error updating prices:', error);
  }
}

updateProductPrices();
