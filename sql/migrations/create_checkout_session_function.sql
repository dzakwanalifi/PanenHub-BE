-- Create RPC function to handle checkout session creation with proper auth context
CREATE OR REPLACE FUNCTION public.create_checkout_session(
  user_id UUID,
  total_amount DECIMAL
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  total_amount DECIMAL,
  payment_status TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.checkout_sessions (user_id, total_amount, payment_status)
  VALUES (user_id, total_amount, 'pending')
  RETURNING 
    checkout_sessions.id,
    checkout_sessions.user_id,
    checkout_sessions.total_amount,
    checkout_sessions.payment_status,
    checkout_sessions.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_checkout_session(UUID, DECIMAL) TO authenticated;
