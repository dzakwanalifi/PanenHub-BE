# `03-BACKEND-MODULES.md`

## Panduan Modul & Fungsi Backend - PanenHub Web App

Dokumen ini merinci modul-modul backend, layanan, dan fungsi spesifik yang perlu dibangun untuk menjalankan logika bisnis PanenHub. Backend kita dibangun sebagai **satu aplikasi monolith yang terstruktur** dengan **Fungsi Database di Supabase** dan **Modul Aplikasi di Google Cloud Run**.

---

### Prinsip Pembagian Tugas

*   **Gunakan Fungsi Database Supabase (PL/pgSQL)** untuk:
    *   Logika yang sangat terikat dengan integritas data (misal: trigger `handle_new_user`).

*   **Gunakan Modul di Aplikasi Monolith Node.js** untuk:
    *   Semua logika bisnis lainnya, termasuk endpoint HTTP, interaksi dengan API pihak ketiga (TriPay), dan alur kerja yang kompleks.

---

### 1. Modul Otentikasi & Profil (Auth & Profile)

*   **Lokasi:** Supabase (Auth + Database Trigger)
*   **Fungsi Utama:**
    *   **Pendaftaran & Login:** Dikelola sepenuhnya oleh **Supabase Auth**. Frontend Next.js berinteraksi langsung dengan Supabase JS Client.
    *   **Reset Password:** Fungsionalitas "Lupa Password" juga dikelola oleh Supabase Auth.
    *   **Pembuatan Profil Otomatis:**
        *   **Nama Fungsi:** `handle_new_user()`
        *   **Tipe:** PostgreSQL Function (Trigger)
        *   **Trigger:** `AFTER INSERT ON auth.users`
        *   **Logika:** Saat pengguna baru berhasil mendaftar, trigger ini otomatis menyisipkan baris baru ke tabel `public.profiles` dan juga membuat keranjang belanja kosong untuknya di tabel `public.carts`.

---

### 2. Modul Toko (Store Module) **[MODUL BARU]**

> **Status Implementasi Saat Ini:** Fungsionalitas ini disimulasikan di sisi klien. Contohnya, logika untuk menjadi penjual saat ini dikelola oleh state di `store/authStore.ts` dan UI placeholder di halaman akun `app/account/page.tsx`. Endpoint ini adalah target untuk implementasi backend.

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Tanggung Jawab:** Mengelola semua operasi yang terkait dengan toko penjual.
*   **Endpoint Utama:**
    *   `POST /stores/create`:
        *   **Aksi:** Pengguna membuat toko baru. Dipanggil dari alur "Buka Toko".
        *   **Logika:**
            1.  Menerima data dari frontend: `store_name`, `description`, `location`.
            2.  Menerima `user_id` dari JWT token yang sudah divalidasi middleware.
            3.  Bungkus dalam transaksi database di Supabase:
                *   `INSERT` data ke tabel `stores`.
                *   `UPDATE` tabel `profiles` dan set `is_seller = true` untuk `user_id` tersebut.
            4.  Return detail toko yang baru dibuat.
    *   `PUT /stores/update`:
        *   **Aksi:** Penjual mengupdate informasi tokonya (nama, banner, dll.) dari dashboard "Toko Saya".
        *   **Logika:** Validasi bahwa `user_id` dari token adalah `owner_id` dari toko yang akan diubah, lalu `UPDATE` data di tabel `stores`.

---

### 3. Modul Pesanan (Order Module) **[MODUL BARU]**

> **Status Implementasi Saat Ini:** Logika checkout disimulasikan sepenuhnya di frontend pada halaman `app/checkout/page.tsx`, dengan data keranjang dari `store/cartStore.ts` dan modal pembayaran palsu di `components/ui/PaymentModal.tsx`. Endpoint ini adalah target untuk implementasi backend yang aman.

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Tanggung Jawab:** Mengelola siklus hidup pesanan pembelian langsung (Direct Purchase).
*   **Endpoint Utama:**
    *   `POST /orders/create_from_cart`:
        *   **Aksi:** Endpoint utama yang dipanggil saat pengguna menekan "Lanjutkan ke Pembayaran" dari keranjang.
        *   **Resep Implementasi:**
            *   **Tujuan:** Mengonversi isi keranjang belanja pengguna menjadi pesanan formal dan menginisiasi pembayaran.
            *   **Langkah-langkah (Logic):**
                1.  Validasi `user_id` dari token JWT.
                2.  Mulai transaksi database di Supabase untuk memastikan atomisitas.
                3.  **Baca Keranjang:** `SELECT` semua item dari `cart_items` yang terhubung dengan `user_id`. Jika keranjang kosong, return error.
                4.  **Kelompokkan per Toko:** Kelompokkan item berdasarkan `store_id` dari produk.
                5.  **Buat Sesi Checkout:** `INSERT` satu baris ke tabel `checkout_sessions` dengan total harga dari semua item di keranjang. Dapatkan `checkout_session_id`.
                6.  **Buat Pesanan:** Untuk setiap kelompok toko, `INSERT` satu baris ke tabel `orders` dan `order_items`, menghubungkannya dengan `checkout_session_id` yang baru dibuat.
                7.  **Kosongkan Keranjang:** `DELETE` semua item dari `cart_items` milik pengguna.
                8.  Selesaikan transaksi database.
                9.  **Panggil Modul Pembayaran:** Panggil fungsi/metode dari `PaymentModule` secara langsung di dalam kode, dengan `checkout_session_id` sebagai argumen.
                10. **Return URL Pembayaran:** Kembalikan URL pembayaran dari `PaymentModule` ke frontend.

---

### 4. Modul Pembayaran (Payment Module) **[DIPERBARUI]**

> **Status Implementasi Saat Ini:** Pembayaran disimulasikan melalui modal konfirmasi di `components/ui/PaymentModal.tsx`. Integrasi TriPay belum diimplementasikan. Endpoint ini adalah target untuk implementasi backend dengan keamanan tinggi.

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Tanggung Jawab:** Menjadi jembatan tunggal antara PanenHub dan TriPay.
*   **Fungsi Utama:**
    *   `createTripayTransaction()`:
        *   **Perubahan:** `merchant_ref` yang diterima sekarang adalah `checkout_session_id` (untuk pembelian langsung) atau `group_buy_join_id` (untuk patungan). Logika signature TriPay tetap sama.
*   **Endpoint Utama:**
    *   `POST /payments/webhook`:
        *   **Perubahan Logika:**
            1.  Verifikasi signature webhook seperti biasa.
            2.  Baca `merchant_ref` dari payload callback.
            3.  **Cek Tipe Referensi:** Tentukan apakah `merchant_ref` ini adalah `checkout_session_id` atau referensi lain.
            4.  **Jika untuk Checkout Session:**
                *   `UPDATE` status di tabel `checkout_sessions` menjadi `paid`.
                *   Cari semua `orders` yang terhubung dengan `checkout_session_id` tersebut, lalu `UPDATE` statusnya menjadi `processing`.
                *   Panggil `NotificationModule` untuk memberitahu semua penjual terkait.
            5.  **Jika untuk Patungan:** Ikuti logika sebelumnya (update `orders`, panggil `GroupBuyModule`).
            6.  Return `{ success: true }` ke TriPay.

---

### 5. Modul Patungan Panen (GroupBuy Module)

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Tanggung Jawab:** Tetap sama, mengelola siklus hidup "Patungan Panen". Modul ini tidak banyak berubah karena logiknya sudah terisolasi.
*   **Catatan:** Modul ini akan diimplementasikan pada fase berikutnya setelah fungsionalitas e-commerce inti selesai, sesuai roadmap yang baru.

---

### 6. Modul Notifikasi (Notification Module) **[DIPERBARUI]**

> **Status Implementasi Saat Ini:** Notifikasi disimulasikan melalui komponen `components/notifications/NotificationPanel.tsx` dengan data mock. Sistem notifikasi push real-time belum terintegrasi. Endpoint ini adalah target untuk implementasi dengan FCM.

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Tanggung Jawab:** Mengirim notifikasi ke pengguna.
*   **Fungsi Utama:** `sendNotification()`
*   **Perubahan Logika:**
    *   Modul ini sekarang harus mendukung **Web Push Notifications**.
    *   Saat dipanggil, ia akan mengambil data langganan Web Push dari tabel `device_tokens` di Supabase.
    *   Menggunakan pustaka seperti `web-push` di Node.js untuk mengirim notifikasi melalui FCM ke browser pengguna.
    *   Akan dipanggil saat:
        *   Pesanan baru masuk untuk penjual.
        *   Status pesanan diupdate oleh penjual.
        *   Status patungan berubah.

---

### Format Respons Error Standar

Semua modul di aplikasi monolith harus mengikuti format JSON yang konsisten untuk error, agar mudah ditangani oleh frontend Next.js.

```typescript
// Contoh error yang diterima frontend:
{
    "error": {
        "code": "INSUFFICIENT_STOCK",
        "message": "Maaf, stok untuk produk 'Mangga Harum Manis' tidak mencukupi."
    }
}
```

Daftar kode error standar yang digunakan (ditambah):
*   **Toko:**
    *   `STORE_NOT_FOUND`: Toko tidak ditemukan.
    *   `NOT_STORE_OWNER`: Pengguna bukan pemilik toko.
*   **Pesanan:**
    *   `EMPTY_CART`: Keranjang kosong saat checkout.
    *   `INSUFFICIENT_STOCK`: Stok produk tidak cukup saat checkout.
    *   `PRODUCT_NOT_AVAILABLE`: Produk sudah tidak tersedia.
*   **Umum:**
    *   `INTERNAL_ERROR`, `INVALID_INPUT`, `NOT_FOUND`, `UNAUTHORIZED`.

---

### ✅ Checklist QA Modul Backend

*   [ ] Endpoint `POST /stores/create` berhasil membuat toko dan mengupdate status `is_seller` pada profil.
*   [ ] Endpoint `POST /orders/create_from_cart` berhasil mengonversi keranjang menjadi beberapa pesanan dan memanggil modul pembayaran dengan benar.
*   [ ] Webhook dari TriPay berhasil diproses dan mengupdate status di tabel `checkout_sessions` dan `orders` secara bersamaan.
*   [ ] Semua error case (stok habis, keranjang kosong) sudah dihandle dan memberikan response yang jelas.
*   [ ] Semua transaksi database menggunakan `transaction` untuk menjamin konsistensi data.
*   [ ] RLS di Supabase sudah diuji untuk memastikan penjual hanya bisa melihat pesanan tokonya dan pembeli hanya bisa melihat pesanannya sendiri.