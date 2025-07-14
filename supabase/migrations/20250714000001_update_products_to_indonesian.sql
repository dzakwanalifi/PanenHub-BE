-- Migration: Update products to use Indonesian language
-- File: 20250714000001_update_products_to_indonesian.sql

-- Update product titles and descriptions to Indonesian
UPDATE public.products 
SET 
  title = 'Paket Beras Organik 25kg',
  description = 'Beras organik premium 25kg dari petani lokal. Cocok untuk keluarga dan usaha kecil.'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.products 
SET 
  title = 'Paket Sayuran Segar',
  description = 'Sayuran musiman campuran untuk keluarga. Berisi 15+ varietas produk segar.'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.products 
SET 
  title = 'Keranjang Buah Premium',
  description = 'Buah-buahan premium yang diantar segar. Berisi buah eksotis dan lokal musiman.'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.products 
SET 
  title = 'Paket Roti Artisan',
  description = 'Roti artisan segar dari toko roti lokal. Sempurna untuk makan keluarga dan acara khusus.'
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE public.products 
SET 
  title = 'Koleksi Madu Lokal',
  description = 'Madu mentah tidak diproses dari peternak lebah lokal. Berbagai sumber bunga untuk rasa yang berbeda.'
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Update prices to Indonesian Rupiah (multiply by 15000 for conversion)
UPDATE public.group_buy_products 
SET 
  original_price = 794850,  -- 52.99 * 15000
  group_price = 689850     -- 45.99 * 15000
WHERE product_id = '11111111-1111-1111-1111-111111111111';

UPDATE public.group_buy_products 
SET 
  original_price = 539850,  -- 35.99 * 15000
  group_price = 449850     -- 29.99 * 15000
WHERE product_id = '22222222-2222-2222-2222-222222222222';

UPDATE public.group_buy_products 
SET 
  original_price = 719850,  -- 47.99 * 15000
  group_price = 599850     -- 39.99 * 15000
WHERE product_id = '33333333-3333-3333-3333-333333333333';

UPDATE public.group_buy_products 
SET 
  original_price = 449850,  -- 29.99 * 15000
  group_price = 374850     -- 24.99 * 15000
WHERE product_id = '44444444-4444-4444-4444-444444444444';

UPDATE public.group_buy_products 
SET 
  original_price = 644850,  -- 42.99 * 15000
  group_price = 539850     -- 35.99 * 15000
WHERE product_id = '55555555-5555-5555-5555-555555555555';
