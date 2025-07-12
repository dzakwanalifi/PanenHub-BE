# PanenHub Backend API Documentation

## Setup dan Konfigurasi

### 1. Environment Variables
Salin file `.env.example` ke `.env` dan isi dengan nilai yang sesuai:

```bash
cp .env.example .env
```

### 2. Supabase SQL Functions
Jalankan script `sql-functions.sql` di Supabase SQL Editor untuk membuat fungsi-fungsi RPC yang diperlukan.

### 3. Menjalankan Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:8080`

## Endpoint API

### Authentication
Semua endpoint yang dilindungi memerlukan header Authorization:
```
Authorization: Bearer <supabase_access_token>
```

### 1. Stores Module

#### POST /api/v1/stores/create
Membuat toko baru (Dilindungi)

**Request Body:**
```json
{
  "store_name": "Toko Sayur Segar",
  "description": "Toko sayuran organik berkualitas tinggi"
}
```

**Response:**
```json
{
  "id": "uuid",
  "owner_id": "uuid", 
  "store_name": "Toko Sayur Segar",
  "description": "Toko sayuran organik berkualitas tinggi"
}
```

#### PUT /api/v1/stores/update/:storeId
Mengupdate toko (Dilindungi) - Belum diimplementasi

### 2. Products Module

#### GET /api/v1/products
Mendapatkan semua produk (Publik)

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Tomat Segar",
    "price": 15000,
    "description": "Tomat segar dari petani lokal",
    "stores": {
      "store_name": "Toko Sayur Segar"
    }
  }
]
```

#### GET /api/v1/products/:id
Mendapatkan detail produk (Publik)

**Response:**
```json
{
  "id": "uuid",
  "title": "Tomat Segar",
  "price": 15000,
  "description": "Tomat segar dari petani lokal",
  "stores": {
    "store_name": "Toko Sayur Segar",
    "owner_id": "uuid"
  }
}
```

### 3. Orders Module

#### POST /api/v1/orders/create_from_cart
Membuat pesanan dari keranjang (Dilindungi)

**Request Body:**
```json
{
  "payment_method": "QRIS"
}
```

**Response:**
```json
{
  "message": "Pesanan berhasil dibuat",
  "payment_details": {
    "reference": "T123456789",
    "checkout_url": "https://tripay.co.id/checkout/T123456789",
    "qr_string": "00020101021226..."
  }
}
```

### 4. Payments Module

#### POST /api/v1/payments/webhook
Webhook untuk notifikasi pembayaran dari TriPay

**Headers:**
```
x-callback-signature: <tripay_signature>
```

**Request Body:**
```json
{
  "merchant_ref": "uuid",
  "status": "PAID",
  "amount": 50000
}
```

## Flow Aplikasi

### 1. Membuat Toko
1. User login dan mendapatkan access token
2. POST `/api/v1/stores/create` dengan token
3. User otomatis menjadi seller

### 2. Membuat Pesanan
1. User menambahkan produk ke keranjang (implementasi frontend)
2. POST `/api/v1/orders/create_from_cart` dengan token
3. Sistem membuat pesanan dan mengembalikan link pembayaran
4. User melakukan pembayaran melalui TriPay

### 3. Proses Pembayaran
1. TriPay mengirim webhook ke `/api/v1/payments/webhook`
2. Sistem memvalidasi signature
3. Jika pembayaran berhasil, status pesanan diupdate

## Error Handling

Semua endpoint mengembalikan error dalam format:
```json
{
  "message": "Pesan error",
  "error": "Detail error (jika ada)"
}
```

## Status Codes
- `200`: OK
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
- `501`: Not Implemented

## Testing dengan Postman

1. **Setup Environment:**
   - `base_url`: `http://localhost:8080`
   - `access_token`: Token dari Supabase Auth

2. **Test Sequence:**
   1. Buat toko baru
   2. Lihat daftar produk
   3. Buat pesanan dari keranjang
   4. Test webhook pembayaran

## Notes

- Pastikan database Supabase sudah disetup dengan schema yang benar
- Fungsi RPC harus dibuat di Supabase sebelum menjalankan server
- Untuk testing webhook, gunakan tools seperti ngrok untuk expose localhost 