-- Seed Migration: Add stores and products to the database
-- This migration adds basic products that can be used for testing
-- Note: For now we'll use a single store to keep it simple

-- Create a simple store without complex auth setup
-- We'll use the existing user from the test data if available
DO $$
BEGIN
  -- Create a basic store entry that doesn't require complex auth setup
  INSERT INTO public.stores (id, owner_id, store_name, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440101', '9f9289e7-d78f-40b8-987d-0af92ac6064c', 'Demo Store', 'Demo store for testing products')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- If the user doesn't exist, we'll skip store creation for now
    NULL;
END $$;

-- Insert products that match the frontend IDs for compatibility
-- All products will use the demo store
INSERT INTO public.products (id, store_id, title, description, price, unit, stock, image_urls) VALUES
  ('00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440101', 'Organic Carrots', 'Fresh, organic carrots grown without pesticides. Perfect for salads, cooking, or snacking. Rich in beta-carotene and vitamins.', 2.99, 'kg', 100, ARRAY['https://images.unsplash.com/photo-1445282768818-728615cc910a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440101', 'Fresh Spinach', 'Nutrient-dense fresh spinach leaves, perfect for salads, smoothies, and cooking. Packed with iron and vitamins.', 3.49, 'bunch', 50, ARRAY['https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440101', 'Red Bell Peppers', 'Crisp and sweet red bell peppers, perfect for cooking, grilling, or eating raw. Rich in vitamin C and antioxidants.', 4.99, 'kg', 75, ARRAY['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440101', 'Organic Tomatoes', 'Juicy organic tomatoes grown without chemicals. Perfect for salads, sauces, and cooking.', 3.99, 'kg', 80, ARRAY['https://images.unsplash.com/photo-1546470427-e5380e0e4a36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440101', 'Fresh Broccoli', 'Fresh broccoli crowns packed with nutrients. Great for steaming, roasting, or adding to stir-fries.', 2.79, 'piece', 60, ARRAY['https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440101', 'Sweet Corn', 'Sweet, tender corn on the cob. Perfect for grilling, boiling, or adding to salads and soups.', 1.99, 'piece', 90, ARRAY['https://images.unsplash.com/photo-1551754655-cd27e38d2076?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440101', 'Organic Lettuce', 'Crisp organic lettuce leaves, perfect for salads and sandwiches. Grown without pesticides.', 2.49, 'head', 70, ARRAY['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440101', 'Purple Eggplant', 'Fresh purple eggplant with glossy skin. Perfect for grilling, roasting, or making Mediterranean dishes.', 3.29, 'piece', 40, ARRAY['https://images.unsplash.com/photo-1659261200833-ec8761558af7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
  ('00000000-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440101', 'Fresh Strawberries', 'Sweet and juicy strawberries perfect for snacking or desserts.', 5.99, 'kg', 30, ARRAY['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'])
ON CONFLICT (id) DO NOTHING;
