-- Migration: Add Group Buy products to database
-- File: 20250713160000_add_group_buy_products.sql

-- Insert group buy products with IDs that match frontend expectations
-- These products will have special pricing for group buying

INSERT INTO public.products (id, store_id, title, description, price, unit, stock, image_urls, category) VALUES
  -- Group Buy Product 1: akan di-map ke gb-1 di frontend
  ('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440101', 
   'Bulk Buy: Organic Rice Bundle', 
   '25kg premium organic rice from local farmers. Perfect for families and small businesses.', 
   45.99, '25kg bundle', 50, 
   ARRAY['https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
   'Grains'),
   
  -- Group Buy Product 2: akan di-map ke gb-2 di frontend
  ('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440101', 
   'Fresh Vegetable Box', 
   'Mixed seasonal vegetables for the whole family. Contains 15+ varieties of fresh produce.', 
   29.99, 'box', 30, 
   ARRAY['https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
   'Vegetables'),
   
  -- Group Buy Product 3: akan di-map ke gb-3 di frontend
  ('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440101', 
   'Premium Fruit Basket', 
   'Assorted premium fruits delivered fresh. Contains exotic and local seasonal fruits.', 
   39.99, 'basket', 25, 
   ARRAY['https://images.unsplash.com/photo-1619566636858-adf3ef46400b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
   'Fruits'),
   
  -- Group Buy Product 4: akan di-map ke gb-4 di frontend
  ('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440101', 
   'Artisan Bread Bundle', 
   'Fresh artisan breads from local bakery. Perfect for family meals and special occasions.', 
   24.99, 'bundle', 40, 
   ARRAY['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
   'Bakery'),
   
  -- Group Buy Product 5: akan di-map ke gb-5 di frontend
  ('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440101', 
   'Local Honey Collection', 
   'Raw, unprocessed honey from local beekeepers. Various floral sources for different tastes.', 
   35.99, '3-jar set', 20, 
   ARRAY['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
   'Pantry')
   
ON CONFLICT (id) DO NOTHING;

-- Create a group_buy_products table to store group buy specific data
CREATE TABLE IF NOT EXISTS public.group_buy_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  original_price DECIMAL(10,2) NOT NULL,
  group_price DECIMAL(10,2) NOT NULL,
  min_participants INTEGER NOT NULL DEFAULT 10,
  max_participants INTEGER NOT NULL DEFAULT 50,
  current_participants INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert group buy data for our products
INSERT INTO public.group_buy_products (product_id, original_price, group_price, min_participants, max_participants, current_participants, start_date, end_date) VALUES
  ('11111111-1111-1111-1111-111111111111', 52.99, 45.99, 15, 30, 12, NOW(), NOW() + INTERVAL '3 days'),
  ('22222222-2222-2222-2222-222222222222', 35.99, 29.99, 10, 20, 8, NOW(), NOW() + INTERVAL '5 days'),
  ('33333333-3333-3333-3333-333333333333', 47.99, 39.99, 20, 40, 18, NOW(), NOW() + INTERVAL '2 days'),
  ('44444444-4444-4444-4444-444444444444', 29.99, 24.99, 12, 25, 6, NOW(), NOW() + INTERVAL '4 days'),
  ('55555555-5555-5555-5555-555555555555', 42.99, 35.99, 8, 15, 4, NOW(), NOW() + INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- Enable RLS on group_buy_products
ALTER TABLE public.group_buy_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for group_buy_products
CREATE POLICY "Allow all users to read group buy products" ON public.group_buy_products
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update group buy products" ON public.group_buy_products
  FOR UPDATE USING (auth.role() = 'authenticated');
