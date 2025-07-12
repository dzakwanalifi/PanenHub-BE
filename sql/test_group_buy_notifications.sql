-- =================================================================
-- SCRIPT TESTING NOTIFIKASI GROUP BUY
-- =================================================================
-- Script ini untuk testing alur notifikasi lengkap untuk Group Buy
-- termasuk kampanye sukses dan gagal dengan notifikasi yang sesuai
-- =================================================================

-- 1. Buat test user dan device token (simulasi pengguna yang sudah subscribe notifikasi)
DO $$
DECLARE
    test_user_id UUID;
    test_store_id UUID;
    test_product_id UUID;
    test_campaign_success_id UUID;
    test_campaign_failed_id UUID;
BEGIN
    -- Insert test user
    INSERT INTO public.profiles (id, email, full_name, is_seller)
    VALUES (gen_random_uuid(), 'testuser@groupbuy.com', 'Test User Group Buy', true)
    RETURNING id INTO test_user_id;
    
    -- Insert test store
    INSERT INTO public.stores (id, owner_id, store_name, description)
    VALUES (gen_random_uuid(), test_user_id, 'Test Store Group Buy', 'Store untuk testing group buy')
    RETURNING id INTO test_store_id;
    
    -- Insert test product
    INSERT INTO public.products (id, store_id, title, description, price, stock)
    VALUES (gen_random_uuid(), test_store_id, 'Test Product Group Buy', 'Product untuk testing', 50000, 100)
    RETURNING id INTO test_product_id;
    
    -- Insert test device token (simulasi user yang sudah subscribe)
    INSERT INTO public.device_tokens (user_id, token_info)
    VALUES (test_user_id, '{
        "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
        "keys": {
            "p256dh": "test-p256dh-key",
            "auth": "test-auth-key"
        }
    }'::jsonb);
    
    -- Create successful campaign (target tercapai, expired)
    INSERT INTO public.group_buy_campaigns (id, product_id, store_id, group_price, target_quantity, current_quantity, start_date, end_date, status)
    VALUES (gen_random_uuid(), test_product_id, test_store_id, 45000.00, 10, 12, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour', 'active')
    RETURNING id INTO test_campaign_success_id;
    
    -- Create failed campaign (target tidak tercapai, expired)
    INSERT INTO public.group_buy_campaigns (id, product_id, store_id, group_price, target_quantity, current_quantity, start_date, end_date, status)
    VALUES (gen_random_uuid(), test_product_id, test_store_id, 40000.00, 20, 8, NOW() - INTERVAL '3 days', NOW() - INTERVAL '30 minutes', 'active')
    RETURNING id INTO test_campaign_failed_id;
    
    -- Create participants for successful campaign
    INSERT INTO public.group_buy_participants (campaign_id, user_id, quantity, total_price, payment_status)
    VALUES 
        (test_campaign_success_id, test_user_id, 5, 225000.00, 'paid'),
        (test_campaign_success_id, gen_random_uuid(), 7, 315000.00, 'paid');
    
    -- Create participants for failed campaign
    INSERT INTO public.group_buy_participants (campaign_id, user_id, quantity, total_price, payment_status)
    VALUES 
        (test_campaign_failed_id, test_user_id, 4, 160000.00, 'paid'),
        (test_campaign_failed_id, gen_random_uuid(), 4, 160000.00, 'paid');
    
    -- Log test data yang dibuat
    INSERT INTO public.system_logs (message)
    VALUES (
        'Test data created - User: ' || test_user_id || 
        ', Success Campaign: ' || test_campaign_success_id ||
        ', Failed Campaign: ' || test_campaign_failed_id
    );
END $$;

-- 2. Lihat kampanye test yang akan diproses
SELECT 
    gc.id,
    gc.target_quantity,
    gc.current_quantity,
    gc.end_date,
    gc.status,
    CASE 
        WHEN gc.current_quantity >= gc.target_quantity THEN 'WILL SUCCEED → Orders + Success Notifications'
        ELSE 'WILL FAIL → Refunds + Failure Notifications'
    END as expected_result,
    COUNT(gbp.id) as participant_count
FROM public.group_buy_campaigns gc
LEFT JOIN public.group_buy_participants gbp ON gc.id = gbp.campaign_id
WHERE gc.status = 'active' 
AND gc.end_date < NOW()
AND gc.created_at > NOW() - INTERVAL '5 minutes' -- Hanya test data terbaru
GROUP BY gc.id, gc.target_quantity, gc.current_quantity, gc.end_date, gc.status
ORDER BY gc.end_date DESC;

-- 3. Jalankan fungsi otomatisasi (ini akan memicu notifikasi)
SELECT public.trigger_group_buy_completion();

-- 4. Verifikasi hasil: Cek perubahan status kampanye
SELECT 
    gc.id,
    gc.target_quantity,
    gc.current_quantity,
    gc.status,
    gc.updated_at,
    CASE gc.status
        WHEN 'successful' THEN '✅ Success - Orders created, success notifications sent'
        WHEN 'failed' THEN '❌ Failed - Refunds processed, failure notifications sent'
        ELSE '⏳ ' || gc.status
    END as result_description
FROM public.group_buy_campaigns gc
WHERE gc.updated_at > NOW() - INTERVAL '2 minutes'
ORDER BY gc.updated_at DESC;

-- 5. Cek partisipan yang terpengaruh
SELECT 
    gbp.id,
    gbp.campaign_id,
    gbp.user_id,
    gbp.payment_status,
    gbp.order_id,
    gc.status as campaign_status,
    CASE 
        WHEN gc.status = 'successful' AND gbp.order_id IS NOT NULL THEN '✅ Order created'
        WHEN gc.status = 'failed' AND gbp.payment_status = 'refunded' THEN '💰 Refund processed'
        ELSE '⏳ Processing'
    END as participant_result
FROM public.group_buy_participants gbp
JOIN public.group_buy_campaigns gc ON gbp.campaign_id = gc.id
WHERE gc.updated_at > NOW() - INTERVAL '2 minutes'
ORDER BY gc.status, gbp.campaign_id;

-- 6. Cek pesanan yang dibuat untuk kampanye sukses
SELECT 
    o.id as order_id,
    o.buyer_id,
    o.store_id,
    o.total_amount,
    o.shipping_status,
    oi.product_id,
    oi.quantity,
    oi.price_at_purchase,
    '✅ Order from successful group buy' as description
FROM public.orders o
JOIN public.order_items oi ON o.id = oi.order_id
WHERE o.created_at > NOW() - INTERVAL '2 minutes'
ORDER BY o.created_at DESC;

-- 7. Cek logs sistem untuk melihat aktivitas notifikasi
SELECT 
    message,
    created_at,
    CASE 
        WHEN message LIKE '%Group Buy automation triggered%' THEN '🔄 Automation'
        WHEN message LIKE '%Error%' THEN '❌ Error'
        ELSE '📝 Info'
    END as log_type
FROM public.system_logs 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC 
LIMIT 10;

-- =================================================================
-- TESTING MANUAL NOTIFIKASI (Opsional)
-- =================================================================

-- Test manual untuk mengirim notifikasi sukses
-- SELECT public.send_group_buy_notification(
--     'test-user-id',
--     'success',
--     'Test Campaign ID'
-- );

-- Test manual untuk mengirim notifikasi gagal
-- SELECT public.send_group_buy_notification(
--     'test-user-id', 
--     'failed',
--     'Test Campaign ID'
-- );

-- =================================================================
-- CLEANUP (Jalankan setelah testing selesai)
-- =================================================================

/*
-- Hapus test data setelah testing
DELETE FROM public.order_items 
WHERE order_id IN (
    SELECT id FROM public.orders 
    WHERE created_at > NOW() - INTERVAL '10 minutes'
);

DELETE FROM public.orders 
WHERE created_at > NOW() - INTERVAL '10 minutes';

DELETE FROM public.group_buy_participants 
WHERE campaign_id IN (
    SELECT id FROM public.group_buy_campaigns 
    WHERE created_at > NOW() - INTERVAL '10 minutes'
);

DELETE FROM public.group_buy_campaigns 
WHERE created_at > NOW() - INTERVAL '10 minutes';

DELETE FROM public.device_tokens 
WHERE created_at > NOW() - INTERVAL '10 minutes';

DELETE FROM public.products 
WHERE created_at > NOW() - INTERVAL '10 minutes';

DELETE FROM public.stores 
WHERE created_at > NOW() - INTERVAL '10 minutes';

DELETE FROM public.profiles 
WHERE created_at > NOW() - INTERVAL '10 minutes'
AND email LIKE '%@groupbuy.com';

DELETE FROM public.system_logs 
WHERE created_at > NOW() - INTERVAL '10 minutes'
AND message LIKE '%Test data created%';
*/ 