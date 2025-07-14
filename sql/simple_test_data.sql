-- Script sederhana untuk membuat test data
-- Jalankan di Supabase SQL Editor

-- 1. Buat test data untuk user (gunakan user ID yang ada)
INSERT INTO public.checkout_sessions (
    id,
    user_id,
    checkout_session_id,
    payment_status,
    payment_method,
    total_amount,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'TEST_SESSION_' || extract(epoch from now())::text,
    'paid',
    'QRIS',
    50000,
    now() - interval '1 day',
    now() - interval '1 day'
) 
ON CONFLICT DO NOTHING;

-- 2. Test query yang digunakan backend
SELECT 
    cs.id,
    cs.checkout_session_id,
    cs.payment_status,
    cs.payment_method,
    cs.total_amount,
    cs.created_at,
    cs.updated_at,
    cs.payment_reference,
    cs.payment_url
FROM public.checkout_sessions cs
WHERE cs.user_id = '9f9289e7-d78f-40b8-987d-0af92ac6064c'
ORDER BY cs.created_at DESC;
