# `03-BACKEND-MODULES.md`

## Panduan Modul & Fungsi Backend - PanenHub Web App

Dokumen ini merinci modul-modul backend, layanan, dan fungsi spesifik yang digunakan untuk menjalankan logika bisnis PanenHub. Backend kita dibangun sebagai **satu aplikasi monolith yang terstruktur** dengan **Fungsi Database di Supabase** dan **Modul Aplikasi di Google Cloud Run**.

---

### Prinsip Pembagian Tugas

*   **Gunakan Fungsi Database Supabase (PL/pgSQL)** untuk:
    *   Logika yang sangat terikat dengan integritas data (misal: trigger `handle_new_user`).
    *   Operasi CRUD dasar yang membutuhkan Row Level Security (RLS).
    *   Fungsi yang perlu diakses langsung dari frontend melalui Supabase Client.

*   **Gunakan Modul di Aplikasi Monolith Node.js** untuk:
    *   Logika bisnis kompleks yang melibatkan multiple tabel.
    *   Interaksi dengan API pihak ketiga (TriPay).
    *   Operasi yang membutuhkan validasi dan transformasi data kompleks.
    *   Endpoint yang memerlukan keamanan tambahan di luar RLS.

---

### 1. Modul Otentikasi & Profil (Auth & Profile)

*   **Lokasi:** Supabase (Auth + Database Trigger)
*   **Status:** ✅ Terimplementasi & Aktif
*   **Fungsi Utama:**
    *   **Pendaftaran & Login:** Dikelola sepenuhnya oleh **Supabase Auth**. Frontend Next.js berinteraksi langsung dengan Supabase JS Client.
    *   **Reset Password:** Fungsionalitas "Lupa Password" sudah aktif dan dikelola oleh Supabase Auth.
    *   **Pembuatan Profil Otomatis:**
        *   **Nama Fungsi:** `handle_new_user()`
        *   **Tipe:** PostgreSQL Function (Trigger)
        *   **Trigger:** `AFTER INSERT ON auth.users`
        *   **Logika:** Saat pengguna baru berhasil mendaftar, trigger ini otomatis:
            - Menyisipkan baris baru ke tabel `public.profiles`
            - Membuat keranjang belanja kosong di tabel `public.carts`
            - Menginisialisasi preferensi notifikasi default

---

### 2. Modul Toko (Store Module)

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Status:** ✅ Terimplementasi & Aktif
*   **Tanggung Jawab:** Mengelola semua operasi yang terkait dengan toko penjual.
*   **Endpoint Utama:**
    *   `POST /stores/create`:
        *   **Status:** ✅ Aktif
        *   **Aksi:** Pengguna membuat toko baru. Dipanggil dari alur "Buka Toko".
        *   **Logika:**
            1.  Menerima data dari frontend: `store_name`, `description`, `location`.
            2.  Menerima `user_id` dari JWT token yang sudah divalidasi middleware.
            3.  Bungkus dalam transaksi database di Supabase:
                *   `INSERT` data ke tabel `stores`.
                *   `UPDATE` tabel `profiles` dan set `is_seller = true` untuk `user_id` tersebut.
            4.  Return detail toko yang baru dibuat.
    *   `PUT /stores/update`:
        *   **Status:** ✅ Aktif
        *   **Aksi:** Penjual mengupdate informasi tokonya (nama, banner, dll.) dari dashboard "Toko Saya".
        *   **Logika:** Validasi bahwa `user_id` dari token adalah `owner_id` dari toko yang akan diubah, lalu `UPDATE` data di tabel `stores`.
    *   `DELETE /stores/:id`:
        *   **Status:** ✅ Aktif
        *   **Aksi:** Penjual menghapus tokonya.
        *   **Logika:**
            1. Validasi kepemilikan toko
            2. Hapus semua produk terkait
            3. Update status seller menjadi false
            4. Hapus toko dari database

---

### 3. Modul Pesanan (Order Module)

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Status:** 🟡 Sebagian Terimplementasi
*   **Tanggung Jawab:** Mengelola siklus hidup pesanan pembelian langsung (Direct Purchase).
*   **Endpoint Utama:**
    *   `POST /orders/create_from_cart`:
        *   **Status:** ✅ Aktif
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

### 4. Modul Pembayaran (Payment Module)

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Status:** 🟡 Dalam Proses Integrasi
*   **Tanggung Jawab:** Menjadi jembatan tunggal antara PanenHub dan TriPay.
*   **Fungsi Utama:**
    *   `createTripayTransaction()`:
        *   **Status:** 🟡 Dalam Pengujian
        *   **Perubahan:** `merchant_ref` yang diterima sekarang adalah `checkout_session_id` (untuk pembelian langsung) atau `group_buy_join_id` (untuk patungan).
*   **Endpoint Utama:**
    *   `POST /payments/webhook`:
        *   **Status:** 🟡 Dalam Pengujian
        *   **Logika:**
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
*   **Status:** ⏳ Direncanakan untuk Fase 2
*   **Tanggung Jawab:** Mengelola siklus hidup "Patungan Panen".
*   **Catatan:** Implementasi ditunda hingga fungsionalitas e-commerce inti selesai.

---

### 6. Modul Notifikasi (Notification Module)

*   **Lokasi:** Modul di dalam Aplikasi Monolith (Node.js/TypeScript)
*   **Status:** 🟡 Sebagian Terimplementasi
*   **Tanggung Jawab:** Mengirim notifikasi ke pengguna.
*   **Fungsi Utama:** 
    *   `sendNotification()`:
        *   **Status:** ✅ Aktif untuk notifikasi in-app
        *   **Implementasi:**
            - Notifikasi in-app melalui Supabase Realtime sudah aktif
            - Web Push Notifications masih dalam pengembangan
    *   `subscribeToNotifications()`:
        *   **Status:** 🟡 Dalam Pengembangan
        *   **Implementasi:**
            - Menyimpan token FCM ke tabel `device_tokens`
            - Setup service worker untuk Web Push

---

### Format Respons Error Standar

Semua modul di aplikasi monolith mengikuti format JSON yang konsisten untuk error:

```typescript
{
    "error": {
        "code": string,    // Kode error standar
        "message": string, // Pesan error yang ramah pengguna
        "details"?: any    // Opsional: Detail tambahan untuk debugging
    }
}
```

Daftar kode error yang diimplementasi:
*   **Toko:**
    *   `STORE_NOT_FOUND`: Toko tidak ditemukan.
    *   `NOT_STORE_OWNER`: Pengguna bukan pemilik toko.
    *   `STORE_HAS_ORDERS`: Toko tidak dapat dihapus karena masih memiliki pesanan aktif.
*   **Pesanan:**
    *   `EMPTY_CART`: Keranjang kosong saat checkout.
    *   `INSUFFICIENT_STOCK`: Stok produk tidak cukup saat checkout.
    *   `PRODUCT_NOT_AVAILABLE`: Produk sudah tidak tersedia.
    *   `INVALID_ORDER_STATUS`: Status pesanan tidak valid untuk operasi ini.
*   **Pembayaran:**
    *   `PAYMENT_FAILED`: Pembayaran gagal diproses.
    *   `INVALID_PAYMENT_SIGNATURE`: Signature webhook tidak valid.
*   **Umum:**
    *   `INTERNAL_ERROR`: Kesalahan internal server.
    *   `INVALID_INPUT`: Input tidak valid.
    *   `NOT_FOUND`: Resource tidak ditemukan.
    *   `UNAUTHORIZED`: Akses tidak diizinkan.
    *   `RATE_LIMITED`: Terlalu banyak request.

---

### ✅ Checklist QA Modul Backend

*   [x] Endpoint `POST /stores/create` berhasil membuat toko dan mengupdate status `is_seller`.
*   [x] Endpoint `DELETE /stores/:id` berhasil menghapus toko dan produk terkait.
*   [x] Endpoint `POST /orders/create_from_cart` berhasil mengonversi keranjang menjadi pesanan.
*   [ ] Webhook TriPay berhasil memproses dan mengupdate status pesanan.
*   [x] Error handling sudah diimplementasi dengan format standar.
*   [x] Transaksi database menggunakan `transaction` untuk konsistensi data.
*   [x] RLS di Supabase sudah aktif dan berfungsi sesuai role pengguna.
*   [ ] Notifikasi Web Push sudah teruji di browser target.
*   [x] Rate limiting sudah diimplementasi untuk semua endpoint publik.
*   [x] Logging dan monitoring sudah disetup di GCP.