# Checklist Implementasi Backend PanenHub (Pendekatan Monolith)

## ✅ Fase 0: Persiapan Infrastruktur & Fondasi

### Setup Repository Backend Monolith
- [x] **Buat repository baru di GitHub untuk backend.**
- [x] **Di lokal, jalankan `git init` dan `npm init -y`.**
- [x] **Install dependencies dasar:**
  ```bash
  npm install express typescript ts-node-dev @types/express @supabase/supabase-js dotenv
  ```
- [x] **Buat file `tsconfig.json` yang mengkompilasi dari `src` ke `dist`.**
- [x] **Buat struktur direktori modular di dalam folder `src`:**
  ```
  src/
  ├── modules/
  │   ├── auth/
  │   ├── stores/
  │   ├── products/
  │   ├── orders/
  │   └── payments/
  ├── core/
  │   ├── supabaseClient.ts
  │   └── middleware/
  └── index.ts  (File utama Express.js)
  ```

### Hubungkan ke Supabase & Implementasi Otentikasi
- [x] **Di `src/core/supabaseClient.ts`, inisialisasi Supabase client menggunakan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dari file `.env`.**
- [x] **Buat middleware di Express untuk memverifikasi JWT dari header `Authorization` pada setiap request yang membutuhkan otentikasi.**

## ✅ Fase 1: Implementasi Modul Inti

### Implementasi Modul `stores` dan `products`
- [x] **Buat file *router* di `src/modules/stores/stores.routes.ts`.**
- [x] **Implementasikan endpoint `POST /stores/create` dan `PUT /stores/update`.**
- [x] **Buat file *router* di `src/modules/products/products.routes.ts`.**
- [x] **Implementasikan endpoint untuk CRUD (Create, Read, Update, Delete) produk yang terikat pada `store_id` dan `owner_id`.**
- [x] **Hubungkan semua *router* modul ke `src/index.ts`.**

### Implementasi Modul `orders`
- [x] **Buat file *router* di `src/modules/orders/orders.routes.ts`.**
- [x] **Implementasikan endpoint utama `POST /orders/create_from_cart`.**
  - [x] **Di dalam endpoint ini, panggil fungsi dari modul `payments` secara langsung.**

### Implementasi Modul `payments`
- [x] **Buat file *service* di `src/modules/payments/payments.service.ts`.**
- [x] **Buat fungsi `createTripayTransaction(...)` yang berisi logika pembuatan *signature* dan panggilan ke API TriPay.**
- [x] **Buat file *router* `src/modules/payments/payments.routes.ts`.**
- [x] **Implementasikan endpoint webhook `POST /payments/webhook` dengan validasi *signature* yang ketat.**

## ✅ Fase 2: Deployment & CI/CD Sederhana

### Siapkan Dockerfile untuk Aplikasi Monolith
- [ ] **Buat satu `Dockerfile` di root proyek backend yang akan meng-copy seluruh proyek, install dependencies, build TypeScript, dan menjalankan `node dist/index.js`.**

### Konfigurasi CI/CD untuk Satu Layanan
- [ ] **Buat workflow GitHub Actions `.github/workflows/deploy.yml`.**
- [ ] **Skrip ini akan lebih sederhana:**
  - **Trigger `on: push: branches: [main]`.**
  - **Tidak perlu *matrix strategy* atau *paths-filter*.**
  - **Hanya satu job `deploy` yang akan:**
    1. **Authenticate ke GCP.**
    2. **Menjalankan `gcloud builds submit . --tag gcr.io/.../panenhub-backend`.**
    3. **Menjalankan `gcloud run deploy panenhub-backend --image gcr.io/...`.**

## ✅ Fase 3: Testing & Quality Assurance

### Testing Endpoint Utama
- [ ] **Test endpoint `POST /stores/create` berhasil membuat toko dan mengupdate status `is_seller` pada profil.**
- [ ] **Test endpoint `POST /orders/create_from_cart` berhasil mengonversi keranjang menjadi beberapa pesanan dan memanggil modul pembayaran dengan benar.**
- [ ] **Test webhook dari TriPay berhasil diproses dan mengupdate status di tabel `checkout_sessions` dan `orders` secara bersamaan.**

### Error Handling & Security
- [ ] **Semua error case (stok habis, keranjang kosong) sudah dihandle dan memberikan response yang jelas.**
- [ ] **Semua transaksi database menggunakan `transaction` untuk menjamin konsistensi data.**
- [ ] **RLS di Supabase sudah diuji untuk memastikan penjual hanya bisa melihat pesanan tokonya dan pembeli hanya bisa melihat pesanannya sendiri.**

## ✅ Fase 4: Optimasi & Monitoring

### Performance & Monitoring
- [ ] **Implementasi logging yang comprehensive untuk debugging.**
- [ ] **Setup monitoring dan alerting di Google Cloud Console.**
- [ ] **Optimasi query database untuk performa yang lebih baik.**

### Documentation & Maintenance
- [ ] **Dokumentasi API endpoints dengan contoh request/response.**
- [ ] **Setup backup strategy untuk database.**
- [ ] **Implementasi health check endpoint (`/health`) untuk monitoring.**

---

**Catatan:** Dengan mengikuti checklist ini, Anda akan membangun satu aplikasi backend yang solid dan modular, yang jauh lebih cepat untuk dikembangkan dan di-deploy, sambil tetap menjaga kemungkinan untuk dipecah menjadi *microservices* di masa depan.