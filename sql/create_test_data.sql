-- Script untuk membuat test data di Supabase production
-- Jalankan script ini di Supabase SQL Editor

-- 1. Pastikan ada profile untuk user yang sedang login (user ID: 9f9289e7-d78f-40b8-987d-0af92ac6064c)
INSERT INTO public.profiles (id, email, full_name, is_seller)
VALUES (
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'dzakwanalifi@apps.ipb.ac.id',
    'Dzakwan Alifi',
    false
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 2. Buat seller profile dan store
INSERT INTO public.profiles (id, email, full_name, is_seller)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'seller1@test.com',
    'Test Seller 1',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stores (id, owner_id, store_name, description, address, phone_number, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Toko Sayur Segar',
    'Menjual berbagai macam sayuran segar dan berkualitas',
    'Jl. Pasar Anyar No. 123, Bogor',
    '081234567890',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. Buat beberapa produk
INSERT INTO public.products (id, store_id, title, description, price, category, stock_quantity, image_urls, is_available)
VALUES 
(
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Bayam Segar',
    'Bayam segar pilihan langsung dari kebun',
    15000,
    'sayuran',
    100,
    '["https://example.com/bayam.jpg"]',
    true
),
(
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'Kangkung Organik',
    'Kangkung organik tanpa pestisida',
    12000,
    'sayuran',
    50,
    '["https://example.com/kangkung.jpg"]',
    true
),
(
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'Tomat Merah',
    'Tomat merah segar untuk masakan',
    20000,
    'sayuran',
    75,
    '["https://example.com/tomat.jpg"]',
    true
) ON CONFLICT (id) DO NOTHING;

-- 4. Buat checkout sessions
INSERT INTO public.checkout_sessions (id, user_id, payment_status, payment_method, total_amount, checkout_session_id, created_at, updated_at)
VALUES 
(
    '66666666-6666-6666-6666-666666666666',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'paid',
    'QRIS',
    47000,
    'SESSION_001',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    '77777777-7777-7777-7777-777777777777',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'pending',
    'QRIS',
    32000,
    'SESSION_002',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    '88888888-8888-8888-8888-888888888888',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'paid',
    'Bank Transfer',
    60000,
    'SESSION_003',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- 5. Buat orders untuk setiap checkout session
INSERT INTO public.orders (id, checkout_session_id, buyer_id, store_id, total_amount, shipping_status)
VALUES 
(
    '99999999-9999-9999-9999-999999999999',
    '66666666-6666-6666-6666-666666666666',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    '22222222-2222-2222-2222-222222222222',
    47000,
    'delivered'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '77777777-7777-7777-7777-777777777777',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    '22222222-2222-2222-2222-222222222222',
    32000,
    'processing'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '88888888-8888-8888-8888-888888888888',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    '22222222-2222-2222-2222-222222222222',
    60000,
    'shipped'
) ON CONFLICT (id) DO NOTHING;

-- 6. Buat order items
INSERT INTO public.order_items (id, order_id, product_id, quantity, price_at_purchase)
VALUES 
-- Order 1 items
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '99999999-9999-9999-9999-999999999999',
    '33333333-3333-3333-3333-333333333333',
    2,
    15000
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '99999999-9999-9999-9999-999999999999',
    '44444444-4444-4444-4444-444444444444',
    1,
    12000
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '99999999-9999-9999-9999-999999999999',
    '55555555-5555-5555-5555-555555555555',
    1,
    20000
),
-- Order 2 items
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    1,
    15000
),
(
    '10101010-1010-1010-1010-101010101010',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '44444444-4444-4444-4444-444444444444',
    1,
    12000
),
-- Order 3 items
(
    '11111111-2222-3333-4444-555555555555',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '55555555-5555-5555-5555-555555555555',
    3,
    20000
) ON CONFLICT (id) DO NOTHING;

-- Verifikasi data yang telah dibuat
SELECT 
    'checkout_sessions' as table_name,
    COUNT(*) as record_count
FROM public.checkout_sessions 
WHERE user_id = '9f9289e7-d78f-40b8-987d-0af92ac6064c'

UNION ALL

SELECT 
    'orders' as table_name,
    COUNT(*) as record_count
FROM public.orders 
WHERE buyer_id = '9f9289e7-d78f-40b8-987d-0af92ac6064c'

UNION ALL

SELECT 
    'order_items' as table_name,
    COUNT(*) as record_count
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.buyer_id = '9f9289e7-d78f-40b8-987d-0af92ac6064c'

UNION ALL

SELECT 
    'products' as table_name,
    COUNT(*) as record_count
FROM public.products

UNION ALL

SELECT 
    'stores' as table_name,
    COUNT(*) as record_count
FROM public.stores;
