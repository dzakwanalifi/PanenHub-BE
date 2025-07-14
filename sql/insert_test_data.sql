-- Insert test data untuk checkout sessions
INSERT INTO public.checkout_sessions (
    id,
    user_id,
    checkout_session_id,
    payment_status,
    payment_method,
    total_amount,
    created_at,
    updated_at
) VALUES 
(
    'aaaa1111-bbbb-2222-cccc-333333333333',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'TEST_SESSION_001',
    'paid',
    'QRIS',
    50000,
    now() - interval '1 day',
    now() - interval '1 day'
),
(
    'bbbb2222-cccc-3333-dddd-444444444444',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'TEST_SESSION_002',
    'pending',
    'Bank Transfer',
    75000,
    now() - interval '2 hours',
    now() - interval '2 hours'
),
(
    'cccc3333-dddd-4444-eeee-555555555555',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    'TEST_SESSION_003',
    'paid',
    'QRIS',
    120000,
    now() - interval '3 days',
    now() - interval '3 days'
)
ON CONFLICT (id) DO NOTHING;
