# 🚀 Panduan Deployment Otomatisasi Group Buy

Panduan ini akan membantu Anda mengatur otomatisasi penyelesaian kampanye "Patungan Panen" (Group Buy) menggunakan Supabase Edge Functions dan pg_cron.

## 📋 Prerequisites

1. **Supabase Project** yang sudah aktif
2. **Supabase CLI** terinstall (sudah ✅)
3. **Docker Desktop** (untuk development lokal - opsional)

## 🔧 Langkah-Langkah Deployment

### 1. Setup Supabase Project

Jika belum ada project Supabase, buat terlebih dahulu:

```bash
# Login ke Supabase
npx supabase login

# Link ke project yang sudah ada ATAU init project baru
npx supabase link --project-ref YOUR_PROJECT_REF
# ATAU
npx supabase init
```

### 2. Deploy Edge Function

```bash
# Deploy fungsi complete-group-buy-campaigns
npx supabase functions deploy complete-group-buy-campaigns

# Setelah deploy, Anda akan mendapat URL seperti:
# https://YOUR_PROJECT_REF.supabase.co/functions/v1/complete-group-buy-campaigns
```

### 3. Aktifkan Extensions di Supabase Dashboard

Buka **Supabase Dashboard** → **Database** → **Extensions**, kemudian aktifkan:

- ✅ **pg_cron** - untuk penjadwalan
- ✅ **http** - untuk HTTP requests

### 4. Update Konfigurasi Database

1. **Jalankan migrasi** `sql/migrations/005_setup_group_buy_automation.sql`
2. **Update URL dan Key** dalam fungsi `trigger_group_buy_completion()`:

```sql
-- Ganti dengan URL dan key yang sebenarnya
function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/complete-group-buy-campaigns';
anon_key := 'YOUR_SUPABASE_ANON_KEY';
```

### 5. Aktifkan Penjadwalan

Jalankan SQL berikut di **SQL Editor** Supabase Dashboard:

```sql
-- Jadwalkan fungsi untuk berjalan setiap jam
SELECT cron.schedule(
    'complete-expired-group-buy-campaigns',
    '0 * * * *', -- Setiap jam pada menit ke-0
    'SELECT public.trigger_group_buy_completion();'
);
```

## 📊 Monitoring & Troubleshooting

### Cek Status Jadwal

```sql
-- Lihat semua jadwal aktif
SELECT * FROM cron.job;

-- Lihat history eksekusi
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Cek Logs Aplikasi

```sql
-- Lihat logs sistem
SELECT * FROM public.system_logs ORDER BY created_at DESC LIMIT 20;
```

### Manual Trigger (untuk Testing)

```sql
-- Jalankan fungsi secara manual untuk testing
SELECT public.trigger_group_buy_completion();
```

## ⚙️ Konfigurasi Jadwal

Anda bisa mengubah frekuensi eksekusi dengan mengubah cron expression:

```sql
-- Setiap 30 menit
'*/30 * * * *'

-- Setiap 6 jam
'0 */6 * * *'

-- Setiap hari jam 9 pagi
'0 9 * * *'
```

## 🔄 Update atau Hapus Jadwal

```sql
-- Update jadwal
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'complete-expired-group-buy-campaigns'),
    schedule := '*/15 * * * *' -- Ubah ke setiap 15 menit
);

-- Hapus jadwal
SELECT cron.unschedule('complete-expired-group-buy-campaigns');
```

## 🧪 Testing

1. **Buat kampanye test** dengan `end_date` yang sudah lewat
2. **Jalankan fungsi manual** untuk memverifikasi
3. **Cek logs** untuk memastikan tidak ada error
4. **Verifikasi** bahwa status kampanye berubah sesuai target

## 📝 Catatan Penting

- **Edge Function** menggunakan Service Role Key untuk akses penuh ke database
- **Notifikasi** akan dikirim otomatis ke partisipan saat kampanye selesai
- **Refund logic** sudah diimplementasikan untuk kampanye yang gagal
- **Logging** tersedia untuk monitoring dan debugging

## 🔒 Security

- Pastikan **Service Role Key** tidak ter-expose di client-side
- **Anon Key** aman untuk digunakan dalam database functions
- **RLS policies** tetap berlaku untuk akses data

---

**Status**: ✅ Siap untuk deployment
**Maintenance**: Otomatis, tidak perlu intervensi manual 