# `04-IMPLEMENTATION-ROADMAP.md`

## Panduan Rencana Implementasi & Rilis - PanenHub Web App

Dokumen ini menguraikan peta jalan pengembangan PanenHub dari persiapan awal hingga rilis MVP (Minimum Viable Product) dan iterasi selanjutnya. Tujuannya adalah untuk memberikan visibilitas, menyelaraskan prioritas, dan menetapkan target yang jelas untuk setiap fase pengembangan.

> **Status Saat Ini:** Tanda centang `[x]` di bawah ini merepresentasikan progres implementasi **frontend**. Sebagian besar fungsionalitas ini sudah memiliki UI dan logika sisi klien yang lengkap, namun masih menggunakan data *mock* dan belum terhubung ke aplikasi backend monolith yang sesungguhnya.

**Durasi Sprint:** 2 Minggu

---

### **Fase 0: Persiapan & Fondasi (Sprint 0 - 1 Minggu)**

*Tujuan: Menyiapkan semua perkakas dan fondasi agar tim dapat bekerja dengan lancar.*

*   **Tugas Tim (Umum):**
    *   `[x]` Setup project management board (Jira, Trello, atau Notion).
    *   `[x]` Finalisasi desain UI/UX (Figma) untuk alur MVP sesuai panduan desain.
    *   `[x]` Buat repository Git (Frontend Next.js & Backend Monolith).
*   **Tugas Backend:**
    *   `[ ]` Buat 1 project di Supabase: `panenhub-mvp`.
    *   `[ ]` Buat 1 project di Google Cloud: `panenhub-mvp`.
    *   `[ ]` Definisikan dan terapkan skema database e-commerce (tabel `stores`, `products`, `orders`, `carts`, dll.) di Supabase.
    *   `[ ]` Setup aplikasi backend monolith dengan struktur modular.
    *   `[ ]` Setup CI/CD sederhana untuk men-deploy satu layanan ke Cloud Run.
*   **Tugas Frontend:**
    *   `[x]` Inisialisasi project Next.js dengan TypeScript dan Tailwind CSS.
    *   `[x]` Setup navigasi dasar (Header untuk desktop, Tab Bar untuk mobile).
    *   `[x]` Integrasikan Supabase JS Client dan konfigurasikan state management (Zustand).
    *   `[ ]` Deploy ke Vercel/Netlify untuk membuat URL development.

---

### **Fase 1: Fondasi E-commerce & Pengalaman Pembeli (Sprint 1 & 2)**

*Tujuan: Membangun alur fundamental agar pengguna bisa masuk, melihat produk, dan membeli.*

*   **Fokus Sprint 1: Penemuan Produk & Otentikasi**
    *   **Fitur:**
        *   `[x]` Alur Pendaftaran & Login via Email/Password (UI dan state management sisi klien selesai).
        *   `[x]` Halaman Beranda dengan grid produk (selesai, menggunakan data mock).
        *   `[x]` Halaman Detail Produk (selesai, menggunakan SSG dengan `generateStaticParams`).
        *   `[ ]` **Backend:** Implementasi modul auth dan endpoint untuk data produk.
    *   **Goal:** Pengguna bisa membuat akun, login, dan menjelajahi katalog produk dengan performa cepat.

*   **Fokus Sprint 2: Alur Transaksi Pertama (Pembelian Langsung)**
    *   **Fitur:**
        *   `[x]` Fungsionalitas Keranjang Belanja (tambah/kurang/hapus item, logika di sisi klien).
        *   `[x]` Alur Checkout (form alamat, pemilihan pengiriman, UI pembayaran simulasi).
        *   `[ ]` **Backend:** Implementasi modul **Orders** & **Payments** untuk memproses checkout dan integrasi dengan TriPay (sandbox).
    *   **Goal:** Pengguna bisa menyelesaikan satu siklus pembelian penuh, dari menambah produk ke keranjang hingga pembayaran berhasil.

---

### **Fase 2: Pemberdayaan Penjual (Sprint 3 & 4)**

*Tujuan: Mengaktifkan sisi penawaran (supply) dengan memungkinkan pengguna menjadi penjual.*

*   **Fokus Sprint 3: Buka Toko & Manajemen Produk**
    *   **Fitur:**
        *   `[ ]` Alur "Buka Toko" untuk pengguna.
        *   `[ ]` **Backend:** Implementasi modul **Stores** dan **Products**.
        *   `[~]` Dashboard "Toko Saya" (kerangka UI dan navigasi sudah dibuat).
        *   `[~]` Halaman Manajemen Produk (kerangka UI dan form tambah/edit produk sudah dibuat).
        *   `[ ]` Integrasi Supabase Storage untuk upload foto produk.
    *   **Goal:** Pengguna bisa mendaftar sebagai penjual, membuat toko, dan mempublikasikan produk mereka ke platform.

*   **Fokus Sprint 4: Manajemen Pesanan & Profil Toko**
    *   **Fitur:**
        *   `[ ]` Dashboard Penjual: Halaman Manajemen Pesanan (melihat pesanan masuk, mengubah status).
        *   `[ ]` **Backend:** Implementasi modul **Notifications** untuk notifikasi pesanan baru (Web Push).
        *   `[ ]` Halaman Publik Toko: Halaman yang bisa dilihat semua orang, menampilkan info toko dan semua produk dari penjual tersebut.
    *   **Goal:** Penjual dapat mengelola siklus hidup pesanan yang masuk dan memiliki etalase digital yang profesional.

---

### **Fase 3: Penyempurnaan & Persiapan Rilis (Sprint 5)**

*Tujuan: Memoles produk, menambahkan fitur esensial, dan memastikan kestabilan untuk rilis.*

*   **Fokus Sprint 5: Ulasan, Pencarian & QA**
    *   **Fitur:**
        *   `[ ]` Sistem Rating & Ulasan untuk produk dan toko.
        *   `[x]` Fungsionalitas Pencarian dasar (UI dan filtering sisi klien di halaman beranda sudah ada).
        *   `[x]` Implementasi desain responsif secara menyeluruh.
        *   `[ ]` Pengujian QA end-to-end yang intensif untuk semua alur.
    *   **Goal:** Platform stabil, fungsional, dan siap untuk diluncurkan ke pengguna awal.

---

### **Rilis MVP (Target: Setelah Sprint 5)**

Pada titik ini, kita memiliki platform e-commerce multi-vendor yang fungsional dan solid.

*   **Checklist Fitur MVP:**
    *   `[x]` Pendaftaran & Login Pengguna.
    *   `[x]` Penjelajahan Katalog Produk (Grid, Detail, Pencarian).
    *   `[x]` Alur Pembelian Langsung (UI Keranjang & Checkout selesai, tapi logika backend & keamanan kritis belum ada).
    *   `[~]` Alur Buka Toko untuk Penjual (UI placeholder ada di halaman akun).
    *   `[~]` Dashboard Penjual (Kerangka Manajemen Produk & Pesanan sudah ada).
    *   `[ ]` Sistem Rating & Ulasan.

*   **Aktivitas Pra-Rilis:**
    *   `[ ]` **Sangat Penting:** Ganti semua kunci API **sandbox** (TriPay, dll.) di Google Secret Manager dengan kunci **live/production**.
    *   `[ ]` Restart aplikasi backend di Cloud Run untuk mengambil kunci live yang baru.
    *   `[ ]` Finalisasi konfigurasi domain (misal: `app.panenhub.com`).
    *   `[ ]` Menyiapkan materi panduan untuk pengguna dan penjual pertama.
    *   `[ ]` Launch!

---

### **Backlog Pasca-MVP (Prioritas Berikutnya)**

Fitur-fitur ini akan dikerjakan dalam iterasi setelah MVP diluncurkan dan feedback dari pengguna mulai masuk.

1.  **P1 - Fitur Inovatif "Patungan Panen":**
    *   Implementasi modul **GroupBuy** dan seluruh alur UI-nya. Ini akan menjadi pembeda utama platform.
2.  **P2 - Peningkatan Pengalaman Penjual:**
    *   Dashboard Analitik yang lebih kaya untuk penjual (grafik penjualan, produk terlaris).
    *   Fitur promosi mandiri (membuat kode diskon).
3.  **P3 - Peningkatan Pengalaman Pembeli:**
    *   Fitur "Wishlist" atau "Produk Favorit".
    *   Filter dan sortir produk yang lebih canggih (berdasarkan harga, rating, lokasi).
4.  **P4 - Skalabilitas & Optimasi:**
    *   Jika diperlukan, ekstrak modul yang menjadi bottleneck menjadi microservice terpisah.
    *   Implementasi caching dan optimasi performa.

---

### ✅ Sprint Checklist (Backend & Frontend)

#### Sprint 1: Fondasi & Penemuan Produk
*   `[ ]` **Backend:** Skema DB sudah final, aplikasi monolith setup dengan modul auth dan products.
*   `[x]` **Frontend:** UI Login, Beranda, dan Detail Produk sudah terhubung dengan data (dummy), perlu integrasi backend.

#### Sprint 2: Transaksi Pertama
*   `[ ]` **Backend:** Modul `Orders` & `Payments` teruji dengan transaksi sandbox.
*   `[x]` **Frontend:** Alur Keranjang & Checkout berfungsi end-to-end di sisi klien, perlu integrasi backend.

#### Sprint 3: Pemberdayaan Penjual (Bagian 1)
*   `[ ]` **Backend:** Modul `Stores` dan `Products` berfungsi, penjual bisa membuat toko dan produk.
*   `[ ]` **Frontend:** UI "Buka Toko", Dashboard Penjual, dan form tambah produk selesai.

#### Sprint 4: Pemberdayaan Penjual (Bagian 2)
*   `[ ]` **Backend:** Modul `Notifications` bisa mengirim notifikasi pesanan baru.
*   `[ ]` **Frontend:** UI Manajemen Pesanan berfungsi, penjual bisa mengubah status pesanan. Halaman Publik Toko menampilkan data dengan benar.

#### Sprint 5: Penyempurnaan & Rilis
*   `[ ]` **QA:** Semua alur (pembeli & penjual) diuji di berbagai perangkat (mobile & desktop).
*   `[ ]` **Tim:** Semua bug kritis diperbaiki. Dokumentasi disiapkan.

---

### ✅ Pre-Release QA Checklist

*   `[ ]` Semua fitur MVP teruji end-to-end di lingkungan staging/development.
*   `[ ]` Desain responsif berfungsi dengan baik di Chrome, Safari, dan Firefox di mobile & desktop.
*   `[ ]` Semua alur pembayaran (sukses, gagal, dibatalkan) diuji dengan kunci sandbox.
*   `[ ]` Performa loading halaman (terutama Beranda & Detail Produk) diukur dan dioptimalkan.
*   `[ ]` Keamanan diperiksa (RLS di Supabase, perlindungan endpoint backend).
*   `[ ]` Semua kredensial dan secret sudah aman di Secret Manager.
*   `[ ]` Semua log error mudah diakses dan dimonitor di Cloud Run dan Vercel.

---

### ✅ Keuntungan Pendekatan Monolith untuk MVP

*   **Pengembangan Lebih Cepat:** Tidak ada kompleksitas komunikasi antar layanan, tim fokus pada fitur.
*   **Deployment Sederhana:** Hanya satu pipeline CI/CD dan satu layanan untuk dikelola.
*   **Debugging Mudah:** Semua log dan error dalam satu tempat.
*   **Evolusi Bertahap:** Struktur modular memungkinkan ekstraksi ke microservices jika diperlukan.