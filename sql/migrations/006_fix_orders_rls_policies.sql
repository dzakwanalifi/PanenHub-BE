-- =================================================================
-- MIGRATION: Fix RLS Policies for Orders and Order Items
-- =================================================================
-- Masalah: Policy RLS hanya mengizinkan SELECT untuk orders dan order_items
-- tetapi tidak ada policy untuk INSERT, UPDATE, DELETE
-- 
-- Solusi: Tambahkan policy lengkap untuk CRUD operations pada orders dan order_items
-- =================================================================

-- Drop existing policies and recreate with complete CRUD permissions

-- Orders table policies
DROP POLICY IF EXISTS "Pengguna & Penjual bisa melihat pesanan terkait" ON public.orders;

-- Allow users to view orders where they are buyer OR seller
CREATE POLICY "Users can view their orders" ON public.orders 
FOR SELECT USING (
  auth.uid() = buyer_id OR 
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = store_id AND stores.owner_id = auth.uid()
  )
);

-- Allow users to create orders as buyers
CREATE POLICY "Users can create orders as buyers" ON public.orders 
FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Allow sellers to update orders for their stores
CREATE POLICY "Sellers can update orders for their stores" ON public.orders 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = store_id AND stores.owner_id = auth.uid()
  )
);

-- Order items table policies  
DROP POLICY IF EXISTS "Pengguna & Penjual bisa melihat item pesanan terkait" ON public.order_items;

-- Allow users to view order items for orders they can see
CREATE POLICY "Users can view order items for their orders" ON public.order_items 
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
);

-- Allow inserting order items for orders the user is creating (as buyer)
CREATE POLICY "Users can create order items for their orders" ON public.order_items 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id AND orders.buyer_id = auth.uid()
  )
);

-- Allow updating order items for orders the seller owns
CREATE POLICY "Sellers can update order items for their orders" ON public.order_items 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    INNER JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_id AND stores.owner_id = auth.uid()
  )
);
