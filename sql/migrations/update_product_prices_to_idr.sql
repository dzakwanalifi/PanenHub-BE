-- Update existing products to use Indonesian Rupiah pricing
-- This converts the existing USD prices to reasonable IDR prices

UPDATE public.products 
SET price = CASE 
  WHEN title = 'Organic Carrots' THEN 15000  -- was 2.99 USD, now Rp 15,000/kg
  WHEN title = 'Fresh Spinach' THEN 12000    -- was 3.49 USD, now Rp 12,000/bunch
  WHEN title = 'Organic Tomatoes' THEN 18000 -- was 3.99 USD, now Rp 18,000/kg
  WHEN title = 'Fresh Strawberries' THEN 45000 -- was 5.99 USD, now Rp 45,000/kg
  WHEN title = 'Red Bell Peppers' THEN 25000   -- was 4.99 USD, now Rp 25,000/kg
  WHEN title = 'Fresh Broccoli' THEN 16000     -- was 2.79 USD, now Rp 16,000/kg
  WHEN title = 'Purple Eggplant' THEN 14000    -- was 3.29 USD, now Rp 14,000/piece
  WHEN title = 'Organic Lettuce' THEN 8000     -- was 2.49 USD, now Rp 8,000/head
  ELSE price * 5000 -- fallback: multiply by 5000 to convert USD to IDR approximately
END
WHERE price < 100; -- Only update products that seem to have USD pricing

-- Also update any other products that might still have USD pricing
UPDATE public.products 
SET price = price * 5000
WHERE price < 100 AND price > 0;
