# PanenHub Backend API Documentation

## Setup dan Konfigurasi

### 1. Environment Variables
Salin file `.env.example` ke `.env` dan isi dengan nilai yang sesuai:

```bash
cp .env.example .env
```

Variabel wajib untuk notifikasi:
```
VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_SUBJECT=mailto:your@email.com
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

**Actions:**
- Update status pesanan
- Kirim notifikasi ke seller melalui web push
- Kirim notifikasi ke buyer melalui web push

### 5. Notifications Module

#### POST /api/v1/notifications/subscribe
Mendaftarkan device untuk menerima notifikasi (Dilindungi)

**Request Body:**
```json
{
  "token": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-auth"
    }
  }
}
```

**Response:**
```json
{
  "message": "Subscription saved successfully."
}
```

#### DELETE /api/v1/notifications/unsubscribe
Menghapus pendaftaran device dari notifikasi (Dilindungi)

**Request Body:**
```json
{
  "token": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-auth"
    }
  }
}
```

**Response:**
```json
{
  "message": "Unsubscribed successfully."
}
```

#### Development Endpoints
Hanya tersedia di environment development (NODE_ENV !== 'production')

##### POST /api/v1/notifications/test-subscribe
Endpoint untuk testing subscribe notifikasi

**Request Body:**
```json
{
  "token": {
    "endpoint": "https://test-endpoint.com",
    "keys": {
      "p256dh": "test-key",
      "auth": "test-auth"
    }
  }
}
```

**Response:**
```json
{
  "message": "Test subscription successful",
  "user_id": "uuid",
  "test_email": "test1234567890@example.com"
}
```

##### POST /api/v1/notifications/test-notification
Endpoint untuk testing pengiriman notifikasi

**Response:**
```json
{
  "message": "Notifications sent: X successful, Y failed",
  "details": [
    {
      "status": "fulfilled|rejected",
      "reason": {}
    }
  ]
}
```

### 6. Group Buy Module (Patungan Panen)

#### GET /api/v1/group-buy
Mendapatkan daftar kampanye patungan aktif (Publik)

**Response:**
```json
[
  {
    "id": "uuid",
    "product": {
      "id": "uuid",
      "title": "Tomat Segar",
      "description": "Tomat segar dari petani lokal"
    },
    "store": {
      "id": "uuid",
      "name": "Toko Sayur Segar",
      "image_url": "https://..."
    },
    "group_price": 12000,
    "target_quantity": 100,
    "current_quantity": 45,
    "start_date": "2024-03-01T00:00:00Z",
    "end_date": "2024-03-20T00:00:00Z",
    "status": "active"
  }
]
```

#### GET /api/v1/group-buy/:id
Mendapatkan detail kampanye patungan (Publik)

**Response:**
```json
{
  "id": "uuid",
  "product": {
    "id": "uuid",
    "title": "Tomat Segar",
    "description": "Tomat segar dari petani lokal"
  },
  "store": {
    "id": "uuid",
    "name": "Toko Sayur Segar",
    "image_url": "https://..."
  },
  "group_price": 12000,
  "target_quantity": 100,
  "current_quantity": 45,
  "start_date": "2024-03-01T00:00:00Z",
  "end_date": "2024-03-20T00:00:00Z",
  "status": "active",
  "participants": [
    {
      "id": "uuid",
      "quantity": 5,
      "payment_status": "paid",
      "created_at": "2024-03-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/v1/group-buy
Membuat kampanye patungan baru (Dilindungi - Hanya pemilik toko)

**Request Body:**
```json
{
  "product_id": "uuid",
  "store_id": "uuid",
  "group_price": 12000,
  "target_quantity": 100,
  "end_date": "2024-03-20T00:00:00Z"
}
```

**Response:**
```json
{
  "message": "Campaign created successfully",
  "campaign": {
    "id": "uuid",
    "product_id": "uuid",
    "store_id": "uuid",
    "group_price": 12000,
    "target_quantity": 100,
    "current_quantity": 0,
    "start_date": "2024-03-01T00:00:00Z",
    "end_date": "2024-03-20T00:00:00Z",
    "status": "active"
  }
}
```

#### PUT /api/v1/group-buy/:id
Mengupdate kampanye patungan (Dilindungi - Hanya pemilik toko)

**Request Body (parsial):**
```json
{
  "group_price": 11500,
  "end_date": "2024-03-22T00:00:00Z"
}
```

**Response:**
```json
{
  "message": "Campaign updated successfully",
  "campaign": {
    "id": "uuid",
    "product_id": "uuid",
    "store_id": "uuid",
    "group_price": 11500,
    "target_quantity": 100,
    "current_quantity": 45,
    "start_date": "2024-03-01T00:00:00Z",
    "end_date": "2024-03-22T00:00:00Z",
    "status": "active"
  }
}
```

#### DELETE /api/v1/group-buy/:id
Menghapus kampanye patungan (Dilindungi - Hanya pemilik toko)

**Response:**
```json
{
  "message": "Campaign deleted successfully"
}
```

#### POST /api/v1/group-buy/:id/join
Bergabung dengan kampanye patungan (Dilindungi)

**Request Body:**
```json
{
  "quantity": 5,
  "payment_method": "QRIS"
}
```

**Response:**
```json
{
  "message": "Successfully joined the campaign",
  "payment_details": {
    "reference": "T123456789",
    "checkout_url": "https://tripay.co.id/checkout/T123456789",
    "qr_string": "00020101021226..."
  }
}
```

### Flow Patungan Panen

1. **Membuat Kampanye:**
   - Pemilik toko login dan dapatkan token
   - POST `/api/group-buy` dengan detail kampanye
   - Kampanye dibuat dengan status "active"

2. **Bergabung Kampanye:**
   - User login dan dapatkan token
   - POST `/api/group-buy/:id/join` dengan jumlah yang diinginkan
   - Sistem membuat record partisipasi dan link pembayaran
   - User melakukan pembayaran melalui TriPay

3. **Proses Pembayaran:**
   - TriPay mengirim webhook ke `/api/payments/webhook`
   - Sistem memvalidasi pembayaran
   - Jika sukses:
     - Update status pembayaran participant
     - Update current_quantity kampanye
     - Kirim notifikasi ke participant

4. **Penyelesaian Kampanye:**
   - Sistem secara otomatis mengecek kampanye yang berakhir
   - Jika target tercapai:
     - Buat pesanan untuk semua participant
     - Kirim notifikasi sukses
   - Jika gagal:
     - Proses refund untuk semua participant
     - Kirim notifikasi kegagalan

## Flow Aplikasi

### 1. Membuat Toko
1. User login dan mendapatkan access token
2. POST `/api/v1/stores/create` dengan token
3. User otomatis menjadi seller
4. Subscribe ke notifikasi toko (opsional)

### 2. Membuat Pesanan
1. User menambahkan produk ke keranjang (implementasi frontend)
2. POST `/api/v1/orders/create_from_cart` dengan token
3. Sistem membuat pesanan dan mengembalikan link pembayaran
4. User melakukan pembayaran melalui TriPay

### 3. Proses Pembayaran dan Notifikasi
1. TriPay mengirim webhook ke `/api/v1/payments/webhook`
2. Sistem memvalidasi signature
3. Jika pembayaran berhasil:
   - Status pesanan diupdate
   - Notifikasi dikirim ke seller
   - Notifikasi dikirim ke buyer (jika subscribed)

### 4. Setup Notifikasi (Frontend)

1. **Register Service Worker:**
```javascript
// Daftarkan service worker
const registration = await navigator.serviceWorker.register('/service-worker.js');
```

2. **Request Permission:**
```javascript
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  // Lanjut ke subscribe
}
```

3. **Subscribe ke Push Notifications:**
```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY' // Dari environment VAPID_PUBLIC_KEY
});

// Kirim subscription ke backend
await fetch('/api/v1/notifications/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseToken}`
  },
  body: JSON.stringify({ token: subscription })
});
```

4. **Service Worker Implementation:**
```javascript
// service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      data: data.data
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Handle click action
  if (event.notification.data?.url) {
    clients.openWindow(event.notification.data.url);
  }
});
```

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
   - `vapid_public_key`: VAPID Public Key untuk testing notifikasi

2. **Test Sequence:**
   1. Buat toko baru
   2. Subscribe untuk notifikasi toko
   3. Lihat daftar produk
   4. Buat pesanan dari keranjang
   5. Test webhook pembayaran
   6. Verifikasi notifikasi diterima

## Notes

- Pastikan database Supabase sudah disetup dengan schema yang benar
- Fungsi RPC harus dibuat di Supabase sebelum menjalankan server
- Untuk testing webhook, gunakan tools seperti ngrok untuk expose localhost
- VAPID keys harus di-generate dan disimpan dengan aman
- Gunakan HTTPS di production untuk Web Push API
- Implementasikan rate limiting untuk endpoint subscribe/unsubscribe
- Validasi token subscription sebelum disimpan 