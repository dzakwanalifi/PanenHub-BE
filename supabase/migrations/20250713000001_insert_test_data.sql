-- Insert test checkout sessions for user
INSERT INTO public.checkout_sessions (
    id,
    user_id,
    total_amount,
    payment_status,
    created_at
) VALUES 
(
    'aaaa1111-bbbb-2222-cccc-333333333333',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    50000,
    'paid',
    now() - interval '1 day'
),
(
    'bbbb2222-cccc-3333-dddd-444444444444',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    75000,
    'pending',
    now() - interval '2 hours'
),
(
    'cccc3333-dddd-4444-eeee-555555555555',
    '9f9289e7-d78f-40b8-987d-0af92ac6064c',
    120000,
    'paid',
    now() - interval '3 days'
)
ON CONFLICT (id) DO NOTHING;
