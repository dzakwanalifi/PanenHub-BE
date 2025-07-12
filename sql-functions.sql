-- SQL Functions untuk PanenHub Backend
-- Jalankan script ini di Supabase SQL Editor

-- 1. Fungsi untuk membuat toko dan mengubah status pengguna menjadi penjual
CREATE OR REPLACE FUNCTION create_store_and_set_seller(
    user_id UUID,
    store_name TEXT,
    store_description TEXT
)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    store_name TEXT,
    description TEXT
) AS $$
BEGIN
    -- Update profil pengguna menjadi penjual
    UPDATE public.profiles
    SET is_seller = TRUE
    WHERE public.profiles.id = user_id;

    -- Insert ke tabel 'stores' dan kembalikan data toko baru
    RETURN QUERY
    INSERT INTO public.stores (owner_id, store_name, description)
    VALUES (user_id, store_name, store_description)
    RETURNING public.stores.id, public.stores.owner_id, public.stores.store_name, public.stores.description;
END;
$$ LANGUAGE plpgsql;

-- 2. Fungsi untuk membuat pesanan dari keranjang (transaksi atomik)
CREATE OR REPLACE FUNCTION create_orders_from_cart(
    p_user_id UUID,
    p_cart_id UUID
)
RETURNS TABLE (
    checkout_session_id UUID,
    total_amount DECIMAL
) AS $$
DECLARE
    v_session_id UUID;
    v_total_amount DECIMAL := 0;
    v_store_id UUID;
    v_store_total DECIMAL;
    v_order_id UUID;
    cart_item RECORD;
BEGIN
    -- 1. Hitung total keseluruhan dari keranjang
    SELECT SUM(ci.quantity * p.price) INTO v_total_amount
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = p_cart_id;

    -- 2. Buat sesi checkout
    INSERT INTO checkout_sessions (user_id, total_amount)
    VALUES (p_user_id, v_total_amount)
    RETURNING id INTO v_session_id;

    -- 3. Kelompokkan item per toko dan buat pesanan
    FOR v_store_id IN 
        SELECT DISTINCT p.store_id
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = p_cart_id
    LOOP
        -- Hitung total untuk toko ini
        SELECT SUM(ci.quantity * p.price) INTO v_store_total
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = p_cart_id AND p.store_id = v_store_id;

        -- Buat pesanan untuk toko ini
        INSERT INTO orders (checkout_session_id, buyer_id, store_id, total_amount)
        VALUES (v_session_id, p_user_id, v_store_id, v_store_total)
        RETURNING id INTO v_order_id;

        -- Masukkan item-item pesanan
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        SELECT v_order_id, ci.product_id, ci.quantity, p.price
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = p_cart_id AND p.store_id = v_store_id;
    END LOOP;

    -- 4. Kosongkan keranjang
    DELETE FROM cart_items WHERE cart_id = p_cart_id;

    -- 5. Kembalikan informasi sesi checkout
    RETURN QUERY
    SELECT v_session_id, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- 3. Fungsi untuk menangani pembayaran yang berhasil
CREATE OR REPLACE FUNCTION handle_successful_payment(p_checkout_session_id UUID)
RETURNS void AS $$
BEGIN
    -- Update status sesi checkout
    UPDATE public.checkout_sessions
    SET payment_status = 'paid'
    WHERE id = p_checkout_session_id;
    
    -- Update status semua order terkait
    UPDATE public.orders
    SET shipping_status = 'processing'
    WHERE checkout_session_id = p_checkout_session_id;
END;
$$ LANGUAGE plpgsql; 