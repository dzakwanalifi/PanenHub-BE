# `05-PAYMENT-GATEWAY-INTEGRATION.md`

## Panduan Integrasi Payment Gateway (TriPay) - PanenHub Web App

Dokumen ini adalah panduan teknis terpusat untuk mengintegrasikan **TriPay Payment Gateway** ke dalam ekosistem PanenHub. Tujuannya adalah untuk memastikan aplikasi backend monolith kita dapat menangani semua skenario pembayaran yang diperlukan, termasuk **checkout keranjang multi-toko** dan fitur inovatif **"Patungan Panen"**.

Dokumen ini merangkum dan menyusun ulang informasi dari dokumentasi resmi TriPay agar relevan dan fokus pada kebutuhan spesifik PanenHub.

---

### **1. Konsep & Alur Kerja Utama**

> **Status Implementasi Saat Ini:** Integrasi TriPay **belum diimplementasikan**. Alur pembayaran saat ini disimulasikan sepenuhnya di frontend melalui modal konfirmasi di `components/ui/PaymentModal.tsx`. Dokumen ini adalah panduan untuk implementasi backend di masa mendatang.

PanenHub akan mengadopsi alur kerja yang dirancang untuk menyederhanakan pengalaman pembeli, bahkan saat mereka membeli dari beberapa penjual dalam satu transaksi, sambil tetap mendukung fitur unik lainnya.

#### **1.1. Jenis Transaksi yang Digunakan**

PanenHub akan secara eksklusif menggunakan **Closed Payment** dari TriPay.
*   **Alasan:** Nominal pembayaran selalu ditentukan di muka oleh sistem PanenHub (total dari semua item di keranjang, atau harga patungan). Satu kode bayar (misal: QR code, VA number) akan merepresentasikan satu sesi transaksi yang unik.

#### **1.2. Alur Kerja Kunci: Checkout Keranjang Multi-Toko**

Ini adalah alur paling penting yang harus ditangani oleh integrasi pembayaran kita untuk fungsionalitas e-commerce inti.

1.  **Pengguna Checkout:** Pengguna menekan tombol "Lanjutkan ke Pembayaran" dari halaman keranjang.
2.  **Frontend Memanggil Backend:** Aplikasi web Next.js memanggil endpoint `POST /orders/create_from_cart` di aplikasi monolith.
3.  **Backend Memproses Pesanan:** Aplikasi monolith membuat satu `checkout_session` unik dan beberapa `orders` terpisah (satu per toko), lalu memanggil **modul pembayaran (`PaymentModule`)** secara langsung di dalam aplikasi.
4.  **Payment Module Request ke TriPay:**
    *   `PaymentModule` melakukan request transaksi Closed Payment ke API TriPay.
    *   **Penting:** `merchant_ref` yang dikirim ke TriPay adalah `checkout_session_id` dari PanenHub.
5.  **Frontend Menampilkan Pembayaran:** URL pembayaran (`checkout_url`) dari TriPay diteruskan kembali ke browser pengguna.
6.  **Pengguna Membayar:** Pengguna menyelesaikan pembayaran melalui halaman TriPay.
7.  **TriPay Mengirim Webhook:** Server TriPay mengirim notifikasi `POST` ke endpoint Webhook kita. Payload callback ini akan berisi `merchant_ref` (yaitu `checkout_session_id` kita).
8.  **Backend Memproses Callback:** Aplikasi monolith memvalidasi callback, meng-update status `checkout_sessions` dan semua `orders` terkait menjadi `processing`, lalu memicu notifikasi ke semua penjual yang relevan.

---

### **2. Konfigurasi Awal & Kredensial**

Tim Backend/DevOps harus menyimpan kredensial TriPay untuk dua fase penggunaan di **Google Secret Manager** dalam project `panenhub-mvp`.

1.  **Kredensial Fase Development:**
    *   Gunakan `API Key`, `Private Key`, `Merchant Code` dari mode **Sandbox** TriPay. Ini akan digunakan selama proses pembangunan aplikasi.
2.  **Kredensial Fase Live:**
    *   Gunakan `API Key`, `Private Key`, `Merchant Code` dari mode **Production** TriPay. Kredensial ini akan menggantikan versi sandbox saat MVP siap diluncurkan ke pengguna.
3.  **Mengaktifkan Channel Pembayaran:**
    *   Pastikan channel pembayaran yang diinginkan (misal: **QRIS (Statis/Dinamis)**, **Virtual Account**, dll.) sudah diaktifkan di pengaturan Merchant TriPay, baik untuk mode Sandbox maupun Production.
4.  **Mengatur URL Callback:**
    *   Di pengaturan Merchant di dashboard TriPay, masukkan URL endpoint webhook aplikasi monolith kita.
    *   Contoh URL: `https://api.panenhub.com/payments/webhook`

---

### **3. Implementasi pada Aplikasi Monolith (Cloud Run)**

Aplikasi ini akan menjadi jembatan tunggal antara PanenHub dan TriPay, menyembunyikan semua kompleksitas dan kunci API.

#### **3.1. Modul: Membuat Transaksi Pembayaran (`PaymentModule.createTripayTransaction()`)**

*   **Fungsi Internal:** `PaymentModule.createTripayTransaction()`
*   **Tujuan:** Dipanggil oleh modul lain (`OrderModule` atau `GroupBuyModule`) untuk membuat sesi pembayaran.
*   **API TriPay yang Dipanggil:** `POST /api/transaction/create` (Closed Payment)
*   **Logika Implementasi:**
    1.  Menerima detail dari modul pemanggil: `amount`, `customer_name`, `customer_email`, `method` (channel pembayaran), dan `reference_id` (ini bisa berupa `checkout_session_id` atau `group_buy_join_id`).
    2.  **Membuat Signature (Kunci Keamanan):**
        *   Ambil `privateKey` dan `merchantCode` dari Secret Manager.
        *   Buat string dengan urutan yang tepat: `merchantCode + reference_id + amount`.
        *   Hash string tersebut menggunakan `HMAC-SHA256` dengan `privateKey`.
        ```javascript
        const signature = crypto.createHmac('sha256', privateKey)
            .update(merchantCode + reference_id + amount)
            .digest('hex');
        ```
    3.  **Membangun Payload:**
        *   Buat objek `payload` yang akan dikirim ke TriPay.
        *   **Kunci Penting:**
            *   `method`: Channel pembayaran yang dipilih, diterima dari request (misal: 'QRISC', 'BRIVA').
            *   `merchant_ref`: Gunakan `reference_id` yang diterima.
            *   `amount`: Total harga.
            *   `customer_name`, `customer_email`: Data pengguna.
            *   `order_items`: Rincian produk yang dipesan (array of objects).
            *   `return_url`: URL di aplikasi web kita tempat pengguna akan diarahkan setelah pembayaran (`/transaksi/sukses`).
            *   `expired_time`: Batas waktu pembayaran (dalam Unix timestamp).
            *   `signature`: Hasil dari langkah 2.
    4.  **Memanggil API TriPay:**
        *   Lakukan `POST` request ke `https://tripay.co.id/api/transaction/create` (atau URL sandbox).
        *   Sertakan `Authorization: Bearer {apiKey}` di header.
    5.  **Mengembalikan Respons ke Modul Pemanggil:**
        *   Jika `success: true`, ekstrak data yang relevan seperti `checkout_url`, `pay_code`, `qr_url` dari respons TriPay.
        *   Kembalikan data ini ke modul pemanggil, yang akan meneruskannya ke frontend.

#### **3.2. Endpoint: Menerima Notifikasi (Webhook) (`POST /payments/webhook`)**

*   **Endpoint Publik:** `POST /payments/webhook`
*   **Tujuan:** Menerima notifikasi status transaksi dari server TriPay.
*   **Logika Implementasi:**
    1.  **Ambil Data & Verifikasi Signature (Sangat Penting!):**
        *   Ambil `raw JSON body` dari request.
        *   Ambil header `X-Callback-Signature`.
        *   Ambil `privateKey` dari Secret Manager.
        *   Hash `raw JSON body` (sebagai string) menggunakan `HMAC-SHA256` dengan `privateKey`.
        *   Bandingkan hasilnya dengan `X-Callback-Signature`. **Jika tidak cocok, hentikan proses dan return error 401.**
        ```javascript
        const localSignature = crypto.createHmac('sha256', privateKey)
            .update(JSON.stringify(request.body))
            .digest('hex');

        if (localSignature !== request.headers['x-callback-signature']) {
            return response.status(401).json({ success: false, message: 'Invalid Signature' });
        }
        ```
    2.  **Proses Data Callback (Idempotent):**
        *   Decode JSON body. Ambil `merchant_ref`, `status`, dan `reference` (ID transaksi TriPay).
        *   **Cek Duplikasi:** Sebelum memproses, cek di database apakah `reference` TriPay ini sudah pernah diproses. Jika sudah, langsung kirim respons sukses untuk menghindari proses ganda.
    3.  **Update Database PanenHub (Atomik):**
        *   Bungkus semua operasi database dalam satu **transaksi**.
        *   Identifikasi tipe `merchant_ref` (apakah ini `checkout_session_id` atau ID lain).
        *   **Jika untuk Checkout Session:**
            *   Cari `checkout_sessions` berdasarkan `id` yang sama dengan `merchant_ref`.
            *   Update `payment_status` sesuai `status` dari TriPay.
            *   Jika status `PAID`, cari semua `orders` yang terkait dan update `shipping_status`-nya menjadi `processing`.
        *   **Jika untuk Patungan:** Ikuti logika spesifik untuk patungan.
    4.  **Panggil Modul Lain (jika perlu):**
        *   Jika status `PAID`, panggil `NotificationModule` untuk mengirim notifikasi ke semua pihak yang relevan (penjual atau peserta patungan).
    5.  **Kirim Respons ke TriPay:**
        *   Kirim respons JSON `{ "success": true }` dengan status `200 OK`. Ini wajib agar TriPay tidak mengirim callback berulang-ulang.

---

### **4. Checklist Implementasi untuk Developer**

1.  [ ] **Backend:** Pastikan semua kredensial TriPay (sandbox & prod) sudah tersimpan di Google Secret Manager dan bisa diakses oleh aplikasi monolith.
2.  [ ] **Backend:** `PaymentModule` telah diimplementasikan dengan logika signature dan webhook yang benar, termasuk penanganan idempotensi.
3.  [ ] **Backend:** `OrderModule` dan `GroupBuyModule` terintegrasi dengan benar, memanggil `PaymentModule` dengan `reference_id` yang sesuai.
4.  [ ] **Frontend:** Alur checkout harus mengarahkan pengguna ke `checkout_url` yang diterima dari backend.
5.  [ ] **Frontend:** Buat halaman `return_url` (misal: `/transaksi/sukses/[orderId]`) yang dinamis untuk menampilkan pesan konfirmasi kepada pengguna.
6.  [ ] **Testing (End-to-End):**
    *   [ ] Uji checkout keranjang dengan **item dari satu toko**.
    *   [ ] Uji checkout keranjang dengan **item dari beberapa toko**. Pastikan semua pesanan ter-update dan semua notifikasi terkirim.
    *   [ ] Uji alur bergabung **Patungan Panen**.
    *   [ ] Uji kasus pembayaran **gagal** atau **kedaluwarsa**. Pastikan status di database tetap sesuai.
    *   [ ] Uji **validasi signature** webhook dengan sengaja mengirim payload yang salah dan pastikan ditolak.

---

### ✅ Checklist Pra-Implementasi & Debugging Payment Gateway

*   [ ] Semua kredensial TriPay (sandbox & prod) sudah tersimpan dan bisa diakses.
*   [ ] Fungsi `PaymentModule.createTripayTransaction()` sudah bisa membuat transaksi dummy di TriPay (cek di dashboard TriPay).
*   [ ] Endpoint `POST /payments/webhook` sudah menerima callback dari TriPay (uji dengan fitur simulator di dashboard TriPay).
*   [ ] Semua status di database (`checkout_sessions`, `orders`) ter-update dengan benar sesuai callback.
*   [ ] Semua error dicatat di log backend (Cloud Run) dan mudah di-debug.
*   [ ] QA frontend: UI pembayaran dan halaman konfirmasi menampilkan status dengan benar.