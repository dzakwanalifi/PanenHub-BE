# `01-PRODUCT-DESIGN-GUIDE.md`

## Panduan Desain Produk & Pengalaman Pengguna (UX) - PanenHub Web App

Dokumen ini adalah panduan fundamental untuk merancang dan membangun antarmuka **Aplikasi Web PanenHub**. Tujuannya adalah untuk memastikan konsistensi, kejelasan, dan pengalaman pengguna yang sejalan dengan visi produk kita. Semua anggota tim (Desainer, Developer, Product) harus mengacu pada panduan ini.

---

### 1. Filosofi & Prinsip Desain

Visi kami adalah menciptakan sebuah **"Platform Pemberdayaan Agro-preneur"** dalam bentuk aplikasi web yang dapat diakses oleh siapa saja, di perangkat apa saja.

*   **Mobile-First & Responsive:** Setiap komponen dan halaman dirancang pertama kali untuk layar ponsel. Desain kemudian harus beradaptasi secara mulus (responsif) ke ukuran layar yang lebih besar seperti tablet dan desktop, memastikan fungsionalitas dan estetika tetap terjaga.
*   **Seller-First Empowerment (Pemberdayaan Penjual):** Desain harus menyediakan alat yang mudah dan kuat bagi penjual untuk mendirikan dan mengelola toko online mereka. Dashboard penjual harus intuitif di mobile dan lebih kaya fitur di desktop.
*   **Seamless Commerce Experience (Pengalaman Belanja Mulus):** Alur belanja untuk pembeli harus cepat dan intuitif. Kurangi friksi dari penemuan produk hingga checkout di semua perangkat.
*   **Trust & Quality Showcase (Menonjolkan Kepercayaan & Kualitas):** Desain harus menonjolkan kualitas produk dan reputasi penjual. Gunakan fotografi produk yang superior, ulasan, rating, dan profil toko yang profesional.
*   **Clean & Modern Aesthetic (Estetika Bersih & Modern):** Antarmuka harus minimalis, dengan banyak ruang putih, sudut membulat, dan bayangan lembut untuk menciptakan pengalaman yang ramah, segar, dan tidak mengintimidasi.
*   **Accessible for All (Dapat Diakses Semua):** Desain harus mematuhi standar aksesibilitas web (WCAG 2.1 Level AA). Pastikan kontras warna memadai, teks dapat dibaca, dan semua elemen interaktif dapat diakses melalui keyboard.

---

### 2. Identitas Visual (Visual Identity)

#### 2.1. Palet Warna (Sesuai Implementasi)

*   **Primary (Utama):**
    *   `#2E7D32` (Hijau Tua) - Digunakan untuk teks & ikon penting, dan state `focus` pada input.
*   **Secondary (Aksen Utama):**
    *   `#A5D6A7` (Hijau Muda) - Digunakan sebagai warna latar belakang utama untuk tombol aksi (CTA), badge, dan elemen aktif seperti tab navigasi.
*   **Accent (Sorotan):**
    *   `#FFC107` (Kuning Mentari) - Digunakan untuk ikon rating bintang dan sorotan lain yang butuh perhatian.
*   **Backgrounds (Latar Belakang):**
    *   `#FFFFFF` (Putih Murni) - Latar belakang utama untuk kartu dan area konten utama.
    *   `#F3F4F6` (Abu-abu Sangat Terang) - Latar belakang untuk hover state atau area sekunder.
*   **Text & Neutrals (Teks & Netral):**
    *   `#1F2937` (Abu-abu Gelap) - Untuk judul dan teks penting.
    *   `#6B7280` (Abu-abu Sedang) - Untuk teks sekunder, deskripsi, dan label.
*   **System Colors (Status Sistem):**
    *   `#10B981` (Hijau Sukses) - Untuk notifikasi keberhasilan.
    *   `#EF4444` (Merah Gagal/Error) - Untuk pesan kesalahan dan validasi.

#### 2.2. Tipografi

*   **Font Family:** `Plus Jakarta Sans` (digunakan dari Google Fonts).
*   **Skala Tipografi (Mobile):**
    *   **Judul H1 (Page Title):** 28px, Bold (`700`)
    *   **Judul H2 (Section Title):** 22px, Semi-Bold (`600`)
    *   **Judul H3 (Card Title):** 18px, Semi-Bold (`600`)
    *   **Body Text (Teks Utama):** 16px, Regular (`400`)
    *   **Caption/Label (Teks Kecil):** 14px, Regular (`400`)
    *   **Button Text:** 16px, Semi-Bold (`600`)

#### 2.3. Ikonografi

*   **Gaya:** Menggunakan ikon gaya **Lightweight dan Outline** yang modern dan bersih.
*   **Sumber:** `lucide-react`.

#### 2.4. Border, Radius & Shadow

Ini adalah elemen kunci untuk estetika modern kita.
*   **Border Radius:**
    *   **Kartu (Cards):** `16px` (`rounded-2xl`)
    *   **Tombol (Buttons):**
        *   **Tombol Aksi Utama (Primary):** Menggunakan `rounded-full` untuk menonjolkan aksi yang paling penting, seperti pada tombol "Lanjut ke Pembayaran" atau tombol `+` pada *mobile tab bar*.
        *   **Tombol Sekunder & Lainnya:** Menggunakan `8px` (`rounded-lg`) untuk konsistensi pada varian `secondary`, `outline`, dan `ghost`.
    *   **Input Fields:** `8px` (`rounded-lg`).
*   **Shadows:** Kami menggunakan bayangan yang halus dan konsisten untuk memberikan kedalaman dan memisahkan elemen interaktif dari latar belakang.
    *   **Kartu Utama:** Menggunakan `shadow-lg` untuk memberikan efek mengangkat yang jelas. Contohnya pada `ProductCard`, `OrderSummary`, dan kartu di halaman `Account`.
    *   **Interaksi Hover:** Pada beberapa elemen seperti `ProductCard`, efek bayangan ditingkatkan menjadi `hover:shadow-xl` untuk memberikan umpan balik visual saat kursor berada di atasnya.
    *   **Implementasi:** Kelas `shadow-lg` adalah standar untuk komponen kartu di seluruh aplikasi untuk menjaga konsistensi visual.

#### 2.5. Spacing & Grid

*   Menggunakan sistem 8-point grid. Semua spasi (margin, padding) harus kelipatan dari 8px.
*   **Container Width (Desktop):** Lebar konten utama di desktop dibatasi maksimal `1280px` (`max-w-7xl`) dan dipusatkan untuk keterbacaan yang optimal.

---

### 3. Arsitektur Informasi & Navigasi Utama (Mobile-First Web App)

#### Navigasi Mobile (Tampilan Ponsel)
Aplikasi web di mobile menggunakan **Tab Bar Bawah yang menempel (sticky)** dengan 5 titik interaksi utama:
1.  **Beranda (Ikon: Rumah):** Pusat penemuan produk.
2.  **Patungan (Ikon: Grup/Users):** Fitur belanja kolektif.
3.  **Jual (Tombol Aksi Utama):** Tombol sentral berbentuk `+` untuk akses cepat memulai penjualan produk.
4.  **Transaksi (Ikon: Kuitansi/ScrollText):** Riwayat pesanan jual/beli.
5.  **Akun (Ikon: Orang/User):** Manajemen profil dan akses ke **"Toko Saya"**.

*Catatan: Akses ke Keranjang Belanja (`/cart`) di mobile berada di header atas.*

*   **Logika Tombol "Jual":** Tombol aksi utama ini memiliki alur cerdas berdasarkan status pengguna:
    1.  Jika pengguna **belum login**, menekan tombol ini akan mengarahkan mereka ke halaman **Login**.
    2.  Jika pengguna **sudah login tetapi bukan penjual**, sebuah modal (`QuickSellModal`) akan muncul untuk mengajak pengguna membuka toko.
    3.  Jika pengguna **adalah penjual**, tombol ini akan langsung mengarahkan ke halaman **Tambah Produk Baru** (`/dashboard/products/manage/new`).

#### Navigasi Desktop (Tampilan Komputer)
Tab bar bawah akan berubah menjadi **Header Atas (Top Header)** yang juga menempel (sticky).
*   **Kiri:** Logo PanenHub.
*   **Tengah:** Kosong. Bilah pencarian utama dipindahkan ke dalam konten Halaman Beranda untuk konteks yang lebih baik.
*   **Kanan:** Ikon navigasi untuk "Pesan", "Notifikasi", "Keranjang Belanja", dan menu dropdown "Akun Saya" yang berisi tautan ke "Profil", "Toko Saya", dan "Logout".

---

### 4. Alur Pengguna Kritis (Key User Flows)

Alur ini dirancang untuk mobile, dan akan beradaptasi di desktop.

#### 4.1. Alur Pembelian Langsung (Direct Purchase)

1.  **Penemuan:** Pengguna scroll di grid produk pada halaman **Beranda**.
2.  **Detail Produk:** Klik pada produk akan membuka halaman detail produk.
    *   **Mobile & Desktop:** Halaman baru dimuat untuk menampilkan detail.
3.  **Tambah ke Keranjang:** Pengguna memilih kuantitas dan menekan tombol **"Tambah ke Keranjang"**. Sebuah notifikasi (toast) akan muncul, dan ikon keranjang di navigasi diperbarui dengan *badge* jumlah.
4.  **Halaman Keranjang:** Pengguna menavigasi ke halaman keranjang (`/cart`) yang menampilkan daftar item.
5.  **Checkout:** Dari halaman keranjang, pengguna menekan **"Lanjutkan ke Pembayaran"**. Alur checkout multi-langkah yang jelas:
    *   Langkah 1: Informasi Pengiriman.
    *   Langkah 2: Ringkasan & Pembayaran.
6.  **Konfirmasi Sukses:** Halaman konfirmasi pesanan yang jelas.

#### 4.2. Alur Buka Toko & Manajemen (Seller Flow)

*Tujuan: Memberikan pengalaman yang optimal di mobile dan desktop.*
1.  **Buka Toko:** Alur pendaftaran toko sama seperti sebelumnya (diakses dari halaman "Akun"), dirancang untuk mobile.
2.  **Dashboard "Toko Saya":**
    *   **Mobile:** Dashboard dirancang vertikal dan ringkas. Fokus pada tugas paling penting: melihat pesanan baru dan statistik kunci. Aksi seperti "Tambah Produk" diakses melalui tombol besar atau FAB.
    *   **Desktop:** Dashboard menggunakan tata letak multi-kolom.
        *   **Kolom Kiri (Sidebar):** Navigasi menu dashboard (Pesanan, Produk, Pelanggan, Analitik, Pengaturan).
        *   **Kolom Kanan (Area Konten):** Menampilkan data detail, tabel, dan grafik yang lebih kaya. Ini adalah *value proposition* utama untuk penjual yang menggunakan desktop.
3.  **Manajemen Produk:**
    *   **Mobile:** Tampilan daftar produk sederhana. Form "Tambah/Edit Produk" disajikan dalam halaman terpisah atau modal layar penuh.
    *   **Desktop:** Tampilan tabel produk dengan fitur sortir, filter, dan *bulk actions* (misal: "Nonaktifkan beberapa produk sekaligus"). Form "Tambah/Edit Produk" bisa ditampilkan di samping daftar untuk efisiensi.

---

### 5. Komponen UI Kunci & Pola Desain

#### ✅ Kartu Produk (Product Card)
*   **Struktur:** Gambar, Nama Produk, Harga, Nama Toko (sebagai tautan), Rating.
*   **Aksi Cepat:** Wajib memiliki tombol ikon `+` hijau di sudut untuk **"Quick Add to Cart"**.
*   **Responsif:** Di desktop, ukuran kartu bisa lebih besar dan ditampilkan dalam grid 4-5 kolom.

#### ✅ Halaman Detail Produk
*   **Struktur Mobile:** Tata letak vertikal: Gambar -> Info -> CTA Bawah.
*   **Struktur Desktop:** Tata letak 2 kolom: Kolom Kiri untuk galeri gambar, Kolom Kanan untuk info produk (nama, harga, deskripsi, pilihan varian) dan tombol CTA.
*   **CTA Bawah (Sticky):** Di mobile, tombol "Tambah ke Keranjang" beserta total harga akan **selalu menempel di bagian bawah layar**. Di desktop, tombol ini berada di posisi statis di kolom kanan.

#### ✅ Formulir & Input
*   **Desain:** Label berada di atas field input. Tampilan bersih dengan `border-radius: 8px`.
*   **Validasi:** Pesan error muncul di bawah field yang relevan dengan warna merah (`#EF4444`) dan ikon.
*   **Interaksi:** Saat fokus, border input berubah menjadi warna primer (`#2E7D32`).

#### ✅ Tombol Aksi Utama (CTA)
*   **Desain:** Latar belakang hijau muda (`#A5D6A7`), teks abu-abu gelap (`#1F2937`), `border-radius: 8px`.
*   **Hover State:** Warna latar menjadi lebih cerah untuk memberikan feedback interaktif.
