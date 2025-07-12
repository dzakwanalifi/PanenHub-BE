-- Migration: Fix RLS Policies for Cart and Profile Creation
-- This migration fixes the Row Level Security policies that are preventing
-- profile and cart creation

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Pengguna bisa melihat & mengedit profil sendiri" ON public.profiles;
DROP POLICY IF EXISTS "Pengguna bisa mengelola keranjangnya sendiri" ON public.carts;

-- Create more permissive policies for profiles
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON public.profiles;
CREATE POLICY "Users can view and edit their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
CREATE POLICY "Allow profile creation" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create more permissive policies for carts
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.carts;
CREATE POLICY "Users can manage their own cart" ON public.carts
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow cart creation" ON public.carts;
CREATE POLICY "Allow cart creation" ON public.carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name) 
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
    
    INSERT INTO public.carts (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for cart creation
DROP FUNCTION IF EXISTS public.create_cart_if_not_exists(UUID);
CREATE OR REPLACE FUNCTION public.create_cart_if_not_exists(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_cart_id UUID;
BEGIN
    -- Try to get existing cart
    SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id;
    
    -- If no cart exists, create one
    IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id) VALUES (p_user_id) RETURNING id INTO v_cart_id;
    END IF;
    
    RETURN v_cart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.create_cart_if_not_exists(UUID) TO authenticated;
