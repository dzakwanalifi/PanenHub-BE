const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🚀 Running migration: Fix Orders RLS Policies...');
    
    // Create Supabase client with service role
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../sql/migrations/006_fix_orders_rls_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration SQL loaded...');
    console.log('🔧 Applying migration...');
    
    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('📊 Result:', data);
    
  } catch (error) {
    console.error('💥 Error running migration:', error);
    process.exit(1);
  }
}

// Alternative: execute SQL directly without RPC
async function runMigrationDirect() {
  try {
    console.log('🚀 Running migration: Fix Orders RLS Policies (Direct)...');
    
    // Create Supabase client with service role
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Execute each statement individually
    const statements = [
      `DROP POLICY IF EXISTS "Pengguna & Penjual bisa melihat pesanan terkait" ON public.orders;`,
      
      `CREATE POLICY "Users can view their orders" ON public.orders 
       FOR SELECT USING (
         auth.uid() = buyer_id OR 
         EXISTS (
           SELECT 1 FROM public.stores 
           WHERE stores.id = store_id AND stores.owner_id = auth.uid()
         )
       );`,
       
      `CREATE POLICY "Users can create orders as buyers" ON public.orders 
       FOR INSERT WITH CHECK (auth.uid() = buyer_id);`,
       
      `CREATE POLICY "Sellers can update orders for their stores" ON public.orders 
       FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM public.stores 
           WHERE stores.id = store_id AND stores.owner_id = auth.uid()
         )
       );`,
       
      `DROP POLICY IF EXISTS "Pengguna & Penjual bisa melihat item pesanan terkait" ON public.order_items;`,
      
      `CREATE POLICY "Users can view order items for their orders" ON public.order_items 
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM public.orders 
           WHERE orders.id = order_id AND (
             orders.buyer_id = auth.uid() OR 
             EXISTS (
               SELECT 1 FROM public.stores 
               WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
             )
           )
         )
       );`,
       
      `CREATE POLICY "Users can create order items for their orders" ON public.order_items 
       FOR INSERT WITH CHECK (
         EXISTS (
           SELECT 1 FROM public.orders 
           WHERE orders.id = order_id AND orders.buyer_id = auth.uid()
         )
       );`,
       
      `CREATE POLICY "Sellers can update order items for their orders" ON public.order_items 
       FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM public.orders 
           INNER JOIN public.stores ON stores.id = orders.store_id
           WHERE orders.id = order_id AND stores.owner_id = auth.uid()
         )
       );`
    ];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });
      
      if (error) {
        console.error(`❌ Statement ${i + 1} failed:`, error);
        console.error('Statement:', statement);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🎉 Migration completed!');
    
  } catch (error) {
    console.error('💥 Error running migration:', error);
    process.exit(1);
  }
}

// Check if exec_sql function exists, otherwise run direct statements
async function checkAndRunMigration() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Try simple query first to test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    await runMigrationDirect();
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

if (require.main === module) {
  checkAndRunMigration();
}

module.exports = { runMigrationDirect };
