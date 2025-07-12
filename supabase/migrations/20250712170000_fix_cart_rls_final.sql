-- Migration: Final Fix for Cart RLS Policies
-- This migration completely fixes the cart RLS policies to allow proper cart creation and management

-- First, disable RLS temporarily to clean up
ALTER TABLE public.carts DISABLE ROW LEVEL SECURITY;

-- Drop all existing cart policies
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.carts;
DROP POLICY IF EXISTS "Allow cart creation" ON public.carts;
DROP POLICY IF EXISTS "Pengguna bisa mengelola keranjangnya sendiri" ON public.carts;

-- Re-enable RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Create simple and permissive policies for carts
CREATE POLICY "Users can access their own cart" ON public.carts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart" ON public.carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also fix cart_items policies to be more permissive
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Pengguna bisa mengelola item keranjangnya" ON public.cart_items;

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for cart_items
CREATE POLICY "Users can access their cart items" ON public.cart_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create cart items" ON public.cart_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.carts TO authenticated;
GRANT ALL ON public.cart_items TO authenticated; 