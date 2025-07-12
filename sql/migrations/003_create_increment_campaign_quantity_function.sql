-- Create function to safely increment campaign quantity
CREATE OR REPLACE FUNCTION increment_campaign_quantity(
    p_campaign_id UUID,
    p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.group_buy_campaigns
    SET current_quantity = current_quantity + p_quantity
    WHERE id = p_campaign_id;
END;
$$; 