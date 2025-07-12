-- =================================================================
-- MIGRASI 004: FUNGSI UNTUK MENANGANI PEMBAYARAN GAGAL/KEDALUWARSA
-- =================================================================
-- Deskripsi:
-- Menambahkan fungsi handle_failed_payment untuk menangani status
-- pembayaran yang gagal atau kedaluwarsa dari webhook TriPay
-- =================================================================

-- Fungsi untuk menangani pembayaran gagal/kedaluwarsa
CREATE OR REPLACE FUNCTION public.handle_failed_payment(p_checkout_session_id UUID)
RETURNS void AS $$
BEGIN
    -- Update status sesi checkout menjadi 'failed'
    UPDATE public.checkout_sessions 
    SET payment_status = 'failed' 
    WHERE id = p_checkout_session_id;
    
    -- Batalkan semua pesanan yang terkait dengan sesi checkout ini
    UPDATE public.orders 
    SET shipping_status = 'cancelled' 
    WHERE checkout_session_id = p_checkout_session_id;
    
    -- Optional: Logika untuk mengembalikan stok produk bisa ditambahkan di sini
    -- Untuk saat ini, kita biarkan stok tetap karena belum ada logic pengurangan stok
    -- saat checkout dibuat (akan diimplementasikan di masa depan)
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 