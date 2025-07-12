-- Create group buy campaign table
CREATE TABLE IF NOT EXISTS public.group_buy_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    store_id UUID NOT NULL,
    
    group_price DECIMAL(10,2) NOT NULL CHECK (group_price > 0),
    target_quantity INTEGER NOT NULL CHECK (target_quantity > 0),
    current_quantity INTEGER DEFAULT 0 NOT NULL,
    
    start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'successful', 'failed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_store FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.group_buy_campaigns IS 'Stores details of each group buy campaign';

-- Create group buy participants table
CREATE TABLE IF NOT EXISTS public.group_buy_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10,2) NOT NULL,
    
    payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    tripay_reference TEXT,
    order_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT fk_campaign FOREIGN KEY(campaign_id) REFERENCES group_buy_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL,
    UNIQUE(campaign_id, user_id)
);

COMMENT ON TABLE public.group_buy_participants IS 'Tracks user participation in group buy campaigns';

-- Enable RLS
ALTER TABLE public.group_buy_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view active campaigns
CREATE POLICY "Allow public read access to active campaigns" ON public.group_buy_campaigns 
FOR SELECT USING (status = 'active');

-- Store owners can create campaigns for their stores
CREATE POLICY "Allow store owners to create campaigns" ON public.group_buy_campaigns 
FOR INSERT WITH CHECK (auth.uid() = (SELECT owner_id FROM stores WHERE id = store_id));

-- Users can view their own participation
CREATE POLICY "Allow users to view their own participation" ON public.group_buy_participants 
FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can join campaigns
CREATE POLICY "Allow authenticated users to join campaigns" ON public.group_buy_participants 
FOR INSERT WITH CHECK (auth.uid() = user_id); 