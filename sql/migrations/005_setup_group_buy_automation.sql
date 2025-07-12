-- =================================================================
-- MIGRASI 005: SETUP OTOMATISASI GROUP BUY CAMPAIGNS
-- =================================================================
-- Deskripsi:
-- Setup penjadwalan otomatis untuk menyelesaikan kampanye Group Buy
-- yang sudah expired menggunakan pg_cron dan Supabase Edge Functions
-- =================================================================

-- 1. Aktifkan ekstensi pg_cron (jika belum aktif)
-- Catatan: Ekstensi ini harus diaktifkan melalui Supabase Dashboard
-- Database > Extensions > search "cron" > Enable
-- Script ini hanya untuk dokumentasi, ekstensi harus diaktifkan manual

-- 2. Aktifkan ekstensi http untuk melakukan HTTP requests
-- Catatan: Ekstensi ini juga harus diaktifkan melalui Supabase Dashboard
-- Database > Extensions > search "http" > Enable

-- 3. Buat fungsi helper untuk memanggil Edge Function
CREATE OR REPLACE FUNCTION public.trigger_group_buy_completion()
RETURNS void AS $$
DECLARE
    function_url TEXT;
    anon_key TEXT;
    response_id BIGINT;
BEGIN
    -- Ambil URL dan key dari environment atau konfigurasi
    -- Dalam implementasi nyata, ganti dengan URL Edge Function yang sebenarnya
    function_url := 'https://vfbzazavjhtqpkhhgpff.supabase.co/functions/v1/complete-group-buy-campaigns';
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmYnphemF2amh0cXBraGhncGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDc1MjgsImV4cCI6MjA2NzYyMzUyOH0.m-gnlEopd9YVyUc49DUN3e4A0_R-Y0OQiScYohUKLxc';
    
    -- Panggil Edge Function menggunakan http extension
    SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || anon_key
        ),
        body := '{}'::jsonb
    ) INTO response_id;
    
    -- Log hasil pemanggilan (opsional)
    INSERT INTO public.system_logs (message, created_at) 
    VALUES (
        'Group Buy automation triggered with response ID: ' || COALESCE(response_id::text, 'null'),
        NOW()
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Log error jika terjadi masalah
    INSERT INTO public.system_logs (message, created_at) 
    VALUES (
        'Error in trigger_group_buy_completion: ' || SQLERRM,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Buat tabel untuk logging (opsional, untuk monitoring)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Script untuk membuat jadwal cron (harus dijalankan setelah Edge Function di-deploy)
-- Uncomment dan jalankan script berikut setelah Edge Function di-deploy:

/*
-- Jadwalkan fungsi untuk berjalan setiap jam
SELECT cron.schedule(
    'complete-expired-group-buy-campaigns', -- Nama jadwal
    '0 * * * *', -- Setiap jam pada menit ke-0
    'SELECT public.trigger_group_buy_completion();'
);
*/

-- 6. Script untuk melihat jadwal yang aktif
-- SELECT * FROM cron.job;

-- 7. Script untuk menghapus jadwal (jika diperlukan)
-- SELECT cron.unschedule('complete-expired-group-buy-campaigns'); 