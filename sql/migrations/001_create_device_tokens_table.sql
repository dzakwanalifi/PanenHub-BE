-- Create device_tokens table
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token_info jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, (token_info->>'endpoint'))
);

-- Add RLS policies
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own device tokens
CREATE POLICY "Users can read own device tokens"
    ON public.device_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own device tokens
CREATE POLICY "Users can insert own device tokens"
    ON public.device_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own device tokens
CREATE POLICY "Users can update own device tokens"
    ON public.device_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own device tokens
CREATE POLICY "Users can delete own device tokens"
    ON public.device_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_device_tokens_updated_at
    BEFORE UPDATE ON public.device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 