import { supabase } from '../../core/supabaseClient';

export interface TestUser {
  id: string;
  email: string;
  access_token: string;
}

export const authenticateTestUser = async (email: string, password: string): Promise<TestUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }

  if (!data.user || !data.session) {
    throw new Error('No user or session returned from authentication');
  }

  return {
    id: data.user.id,
    email: data.user.email!,
    access_token: data.session.access_token
  };
};

export const cleanupTestUser = async (userId: string): Promise<void> => {
  try {
    // Clean up user data in order due to foreign key constraints
    
    // Get user's stores first
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', userId);
    
    const storeIds = stores?.map(store => store.id) || [];
    
    // Get user's orders first
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', userId);
    
    const orderIds = orders?.map(order => order.id) || [];
    
    // Clean up in proper order
    if (orderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', orderIds);
    }
    
    if (storeIds.length > 0) {
      await supabase.from('products').delete().in('store_id', storeIds);
    }
    
    await supabase.from('cart_items').delete().eq('cart_id', userId);
    await supabase.from('carts').delete().eq('user_id', userId);
    await supabase.from('orders').delete().eq('buyer_id', userId);
    await supabase.from('checkout_sessions').delete().eq('user_id', userId);
    await supabase.from('stores').delete().eq('owner_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    
    // Finally delete the auth user
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn('Error during cleanup:', error);
  }
}; 