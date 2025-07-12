-- =================================================================
-- SKRIP MIGRASI DATABASE LENGKAP - PANENHUB (VERSI FINAL)
-- =================================================================
-- Deskripsi:
-- Skrip ini akan membersihkan dan mengatur ulang seluruh skema database
-- publik untuk aplikasi PanenHub, termasuk modul e-commerce inti,
-- fitur Patungan Panen (Group Buy), dan trigger otomatis.
--
-- Cara Penggunaan:
-- 1. Jalankan BAGIAN 0 untuk membersihkan database (opsional jika DB baru).
-- 2. Jalankan sisa skrip (BAGIAN 1 s/d 5) secara keseluruhan.
-- =================================================================


-- =================================================================
-- BAGIAN 0: RESET TOTAL DATABASE (Jalankan jika perlu)
-- =================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Hapus semua RLS policies
    FOR r IN
        SELECT format('DROP POLICY IF EXISTS %I ON %I.%I;', policyname, schemaname, tablename) AS q
        FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE r.q;
    END LOOP;

    -- Hapus semua Triggers
    FOR r IN SELECT 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || event_object_schema || '.' || event_object_table || ' CASCADE;' AS q FROM information_schema.triggers WHERE trigger_schema = 'public' LOOP EXECUTE r.q; END LOOP;
    -- Hapus semua Functions
    FOR r IN SELECT 'DROP FUNCTION IF EXISTS ' || ns.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ');' AS q FROM pg_proc p JOIN pg_namespace ns ON p.pronamespace = ns.oid WHERE ns.nspname = 'public' AND pg_catalog.pg_get_userbyid(p.proowner) NOT LIKE 'supabase%' AND pg_catalog.pg_get_userbyid(p.proowner) <> 'postgres' LOOP EXECUTE r.q; END LOOP;
END;
$$;
-- Hapus semua Tabel
DROP TABLE IF EXISTS public.group_buy_participants, public.group_buy_campaigns, public.order_items, public.orders, public.checkout_sessions, public.cart_items, public.carts, public.products, public.stores, public.device_tokens, public.profiles CASCADE;


-- =================================================================
-- BAGIAN 1: CREATE TABLES
-- =================================================================

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_seller BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    store_name TEXT NOT NULL,
    description TEXT,
    banner_url TEXT,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'pcs',
    stock INTEGER DEFAULT 0 NOT NULL,
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.checkout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkout_session_id UUID REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_status TEXT DEFAULT 'processing' NOT NULL CHECK (shipping_status IN ('processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_info JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_device_endpoint_idx ON public.device_tokens (user_id, ((token_info->>'endpoint')));

CREATE TABLE public.group_buy_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    group_price DECIMAL(10,2) NOT NULL CHECK (group_price > 0),
    target_quantity INTEGER NOT NULL CHECK (target_quantity > 0),
    current_quantity INTEGER DEFAULT 0 NOT NULL,
    start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'successful', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.group_buy_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.group_buy_campaigns(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    tripay_reference TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(campaign_id, user_id)
);


-- =================================================================
-- BAGIAN 2: CREATE FUNCTIONS
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    INSERT INTO public.carts (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_store_and_set_seller(p_user_id UUID, p_store_name TEXT, p_store_description TEXT)
RETURNS SETOF stores AS $$
BEGIN
    UPDATE public.profiles SET is_seller = TRUE WHERE id = p_user_id;
    RETURN QUERY INSERT INTO public.stores (owner_id, store_name, description) VALUES (p_user_id, p_store_name, p_store_description) RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_orders_from_cart(p_user_id UUID, p_cart_id UUID)
RETURNS TABLE (checkout_session_id UUID, total_amount DECIMAL) AS $$
DECLARE
    v_session_id UUID; v_total_amount DECIMAL := 0; v_store_id UUID; v_store_total DECIMAL; v_order_id UUID;
BEGIN
    SELECT SUM(ci.quantity * p.price) INTO v_total_amount FROM public.cart_items ci JOIN public.products p ON ci.product_id = p.id WHERE ci.cart_id = p_cart_id;
    IF v_total_amount IS NULL OR v_total_amount <= 0 THEN RETURN; END IF;
    INSERT INTO public.checkout_sessions (user_id, total_amount) VALUES (p_user_id, v_total_amount) RETURNING id INTO v_session_id;
    FOR v_store_id IN SELECT DISTINCT p.store_id FROM public.cart_items ci JOIN public.products p ON ci.product_id = p.id WHERE ci.cart_id = p_cart_id LOOP
        SELECT SUM(ci.quantity * p.price) INTO v_store_total FROM public.cart_items ci JOIN public.products p ON ci.product_id = p.id WHERE ci.cart_id = p_cart_id AND p.store_id = v_store_id;
        INSERT INTO public.orders (checkout_session_id, buyer_id, store_id, total_amount) VALUES (v_session_id, p_user_id, v_store_id, v_store_total) RETURNING id INTO v_order_id;
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase) SELECT v_order_id, ci.product_id, ci.quantity, p.price FROM public.cart_items ci JOIN public.products p ON ci.product_id = p.id WHERE ci.cart_id = p_cart_id AND p.store_id = v_store_id;
    END LOOP;
    DELETE FROM public.cart_items WHERE cart_id = p_cart_id;
    RETURN QUERY SELECT v_session_id, v_total_amount;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_successful_payment(p_checkout_session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.checkout_sessions SET payment_status = 'paid' WHERE id = p_checkout_session_id;
    UPDATE public.orders SET shipping_status = 'processing' WHERE checkout_session_id = p_checkout_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_group_buy_payment(p_participant_id UUID)
RETURNS void AS $$
DECLARE
    v_campaign_id UUID; v_quantity INT;
BEGIN
    UPDATE public.group_buy_participants SET payment_status = 'paid' WHERE id = p_participant_id RETURNING campaign_id, quantity INTO v_campaign_id, v_quantity;
    IF v_campaign_id IS NOT NULL THEN UPDATE public.group_buy_campaigns SET current_quantity = current_quantity + v_quantity WHERE id = v_campaign_id; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- BAGIAN 3: CREATE TRIGGERS (VERSI PERBAIKAN)
-- =================================================================

-- Hapus trigger lama jika ada, lalu buat yang baru
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_stores_updated_at ON public.stores;
CREATE TRIGGER handle_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_carts_updated_at ON public.carts;
CREATE TRIGGER handle_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER handle_device_tokens_updated_at BEFORE UPDATE ON public.device_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_group_buy_campaigns_updated_at ON public.group_buy_campaigns;
CREATE TRIGGER handle_group_buy_campaigns_updated_at BEFORE UPDATE ON public.group_buy_campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =================================================================
-- BAGIAN 4: SETUP ROW LEVEL SECURITY (RLS)
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna bisa melihat & mengedit profil sendiri" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Siapa saja bisa melihat toko" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Penjual bisa mengelola tokonya sendiri" ON public.stores FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Siapa saja bisa melihat produk" ON public.products FOR SELECT USING (true);
CREATE POLICY "Penjual bisa mengelola produk di tokonya" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Pengguna bisa mengelola keranjangnya sendiri" ON public.carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Pengguna bisa mengelola item di keranjangnya" ON public.cart_items FOR ALL USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_id AND carts.user_id = auth.uid()));
CREATE POLICY "Pengguna bisa mengelola sesi checkoutnya" ON public.checkout_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Pengguna & Penjual bisa melihat pesanan terkait" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Pengguna & Penjual bisa melihat item pesanan terkait" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (orders.buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()))));
CREATE POLICY "Pengguna bisa mengelola token perangkatnya" ON public.device_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Siapa saja bisa melihat kampanye aktif" ON public.group_buy_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Penjual bisa membuat kampanye untuk tokonya" ON public.group_buy_campaigns FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()));
CREATE POLICY "Pengguna bisa melihat partisipasinya sendiri" ON public.group_buy_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Pengguna bisa bergabung ke kampanye" ON public.group_buy_participants FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =================================================================
-- BAGIAN 5: GRANT PERMISSIONS
-- =================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON public.stores, public.products, public.group_buy_campaigns TO anon;
