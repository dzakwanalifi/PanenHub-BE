-- =================================================================
-- SCRIPT TESTING OTOMATISASI GROUP BUY
-- =================================================================
-- Script ini untuk testing otomatisasi penyelesaian kampanye Group Buy
-- Gunakan script ini untuk memverifikasi bahwa sistem bekerja dengan baik
-- =================================================================

-- 1. Buat data test untuk kampanye yang berhasil
-- (current_quantity >= target_quantity)
INSERT INTO public.group_buy_campaigns (
    id,
    product_id,
    store_id,
    group_price,
    target_quantity,
    current_quantity,
    start_date,
    end_date,
    status
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM public.products LIMIT 1), -- Ambil produk pertama
    (SELECT id FROM public.stores LIMIT 1),   -- Ambil store pertama
    45000.00,
    10,
    12, -- Sudah mencapai target
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 hour', -- Sudah expired 1 jam lalu
    'active'
) ON CONFLICT DO NOTHING;

-- 2. Buat data test untuk kampanye yang gagal
-- (current_quantity < target_quantity)
INSERT INTO public.group_buy_campaigns (
    id,
    product_id,
    store_id,
    group_price,
    target_quantity,
    current_quantity,
    start_date,
    end_date,
    status
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM public.products LIMIT 1), -- Ambil produk pertama
    (SELECT id FROM public.stores LIMIT 1),   -- Ambil store pertama
    35000.00,
    20,
    8, -- Belum mencapai target
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '30 minutes', -- Sudah expired 30 menit lalu
    'active'
) ON CONFLICT DO NOTHING;

-- 3. Lihat kampanye yang akan diproses
SELECT 
    id,
    target_quantity,
    current_quantity,
    end_date,
    status,
    CASE 
        WHEN current_quantity >= target_quantity THEN 'WILL SUCCEED'
        ELSE 'WILL FAIL'
    END as expected_result
FROM public.group_buy_campaigns 
WHERE status = 'active' 
AND end_date < NOW()
ORDER BY end_date DESC;

-- 4. Jalankan fungsi otomatisasi secara manual
SELECT public.trigger_group_buy_completion();

-- 5. Verifikasi hasil: Cek perubahan status kampanye
SELECT 
    id,
    target_quantity,
    current_quantity,
    end_date,
    status,
    updated_at
FROM public.group_buy_campaigns 
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;

-- 6. Cek logs sistem
SELECT 
    message,
    created_at
FROM public.system_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Cek jadwal cron yang aktif
SELECT 
    jobname,
    schedule,
    active,
    jobid
FROM cron.job 
WHERE jobname LIKE '%group-buy%';

-- 8. Cek history eksekusi cron (jika ada)
SELECT 
    j.jobname,
    r.start_time,
    r.end_time,
    r.return_message,
    r.status
FROM cron.job j
LEFT JOIN cron.job_run_details r ON j.jobid = r.jobid
WHERE j.jobname LIKE '%group-buy%'
ORDER BY r.start_time DESC
LIMIT 5;

-- =================================================================
-- CLEANUP (Opsional - untuk menghapus data test)
-- =================================================================

-- Uncomment jika ingin menghapus data test setelah testing
/*
DELETE FROM public.group_buy_campaigns 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND (
    (target_quantity = 10 AND current_quantity = 12) OR
    (target_quantity = 20 AND current_quantity = 8)
);

DELETE FROM public.system_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND message LIKE '%Group Buy automation%';
*/ 