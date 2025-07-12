# PanenHub Backend API Documentation

## Setup dan Konfigurasi

### 1. Environment Variables
Salin file `.env.example` ke `.env` dan isi dengan nilai yang sesuai:

```bash
cp .env.example .env
```

Variabel wajib:
```env
# Server Configuration
PORT=8080
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# TriPay Configuration
TRIPAY_API_KEY=your_tripay_api_key
TRIPAY_PRIVATE_KEY=your_tripay_private_key
TRIPAY_MERCHANT_CODE=your_merchant_code

# Web Push Notification Configuration
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### 2. Database Setup
Pastikan database Supabase sudah disetup dengan menjalankan migration files:
- `sql/migrations/000.sql` - Schema utama
- `sql/migrations/001_create_device_tokens_table.sql` - Device tokens
- `sql/migrations/002_create_group_buy_tables.sql` - Group Buy tables

### 3. Menjalankan Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Server akan berjalan di `http://localhost:8080`

## Authentication

### Metode Autentikasi
Backend menggunakan **Supabase Auth** dengan JWT tokens. Authentication middleware menggunakan `supabase.auth.getUser(token)` untuk validasi.

### Header Authorization
Semua endpoint yang dilindungi memerlukan header Authorization:
```
Authorization: Bearer <supabase_access_token>
```

### Mendapatkan Access Token
```javascript
// Frontend - Menggunakan Supabase Client
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const accessToken = data.session.access_token;
```

## Endpoint API

### Health Check

#### GET /health
Mengecek status server

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-03-01T10:00:00.000Z"
}
```

### 1. Auth Module

#### GET /api/v1/auth/status
Mengecek status modul authentication (Publik)

**Response:**
```json
{
  "message": "Auth module is active. Authentication is handled by Supabase directly."
}
```

### 2. Stores Module

#### GET /api/v1/stores
Mendapatkan semua toko (Publik)

**Response:**
```json
[
  {
    "id": "uuid",
    "owner_id": "uuid",
    "store_name": "Toko Sayur Segar",
    "description": "Toko sayuran organik berkualitas tinggi",
    "banner_url": "https://example.com/banner.jpg",
    "location": null,
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
]
```

#### GET /api/v1/stores/:id
Mendapatkan detail toko (Publik)

**Response:**
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "store_name": "Toko Sayur Segar",
  "description": "Toko sayuran organik berkualitas tinggi",
  "banner_url": "https://example.com/banner.jpg",
  "location": null,
  "created_at": "2024-03-01T10:00:00Z",
  "updated_at": "2024-03-01T10:00:00Z"
}
```

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
  "description": "Toko sayuran organik berkualitas tinggi",
  "banner_url": null,
  "location": null,
  "created_at": "2024-03-01T10:00:00Z",
  "updated_at": "2024-03-01T10:00:00Z"
}
```

#### PUT /api/v1/stores/update/:storeId
Mengupdate toko (Dilindungi - Hanya pemilik toko)

**Request Body:**
```json
{
  "store_name": "Toko Sayur Premium",
  "description": "Toko sayuran organik premium"
}
```

#### DELETE /api/v1/stores/delete/:storeId
Menghapus toko (Dilindungi - Hanya pemilik toko)

**Response:**
```json
{
  "message": "Toko berhasil dihapus"
}
```

### 3. Products Module

#### GET /api/v1/products
Mendapatkan semua produk (Publik)

**Response:**
```json
[
  {
    "id": "uuid",
    "store_id": "uuid",
    "title": "Tomat Segar",
    "description": "Tomat segar dari petani lokal",
    "price": 15000,
    "unit": "kg",
    "stock": 100,
    "image_urls": ["https://example.com/tomato.jpg"],
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z",
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
  "store_id": "uuid",
  "title": "Tomat Segar",
  "description": "Tomat segar dari petani lokal",
  "price": 15000,
  "unit": "kg",
  "stock": 100,
  "image_urls": ["https://example.com/tomato.jpg"],
  "created_at": "2024-03-01T10:00:00Z",
  "updated_at": "2024-03-01T10:00:00Z",
  "stores": {
    "store_name": "Toko Sayur Segar",
    "owner_id": "uuid"
  }
}
```

### 4. Orders Module

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

### 5. Payments Module

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

### 6. Notifications Module

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

### 7. Group Buy Module (Patungan Panen) ✅

#### GET /api/v1/group-buy
Mendapatkan daftar kampanye patungan aktif (Publik)

**Response:**
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "store_id": "uuid",
    "group_price": 20000,
    "target_quantity": 50,
    "current_quantity": 25,
    "start_date": "2024-03-01T00:00:00Z",
    "end_date": "2024-03-20T00:00:00Z",
    "status": "active",
    "created_at": "2024-03-01T00:00:00Z",
    "updated_at": "2024-03-01T00:00:00Z",
    "product": {
      "id": "uuid",
      "title": "Mangga Harum Manis",
      "description": "Mangga manis dari petani lokal",
      "price": 25000,
      "unit": "kg"
    },
    "store": {
      "id": "uuid",
      "store_name": "Toko Test Panen",
      "banner_url": null
    }
  }
]
```

#### GET /api/v1/group-buy/:id
Mendapatkan detail kampanye patungan (Publik)

**Response:**
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "store_id": "uuid",
  "group_price": 20000,
  "target_quantity": 50,
  "current_quantity": 25,
  "start_date": "2024-03-01T00:00:00Z",
  "end_date": "2024-03-20T00:00:00Z",
  "status": "active",
  "created_at": "2024-03-01T00:00:00Z",
  "updated_at": "2024-03-01T00:00:00Z",
  "product": {
    "id": "uuid",
    "title": "Mangga Harum Manis",
    "description": "Mangga manis dari petani lokal",
    "price": 25000,
    "unit": "kg"
  },
  "store": {
    "id": "uuid",
    "store_name": "Toko Test Panen",
    "banner_url": null
  },
  "participants": [
    {
      "id": "uuid",
      "quantity": 10,
      "payment_status": "pending",
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
  "group_price": 20000,
  "target_quantity": 50,
  "end_date": "2025-08-15T23:59:59Z"
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
    "group_price": 20000,
    "target_quantity": 50,
    "current_quantity": 0,
    "start_date": "2024-03-01T00:00:00Z",
    "end_date": "2025-08-15T23:59:59Z",
    "status": "active",
    "created_at": "2024-03-01T00:00:00Z",
    "updated_at": "2024-03-01T00:00:00Z"
  }
}
```

**Validation Rules:**
- `product_id`: Required, must be valid UUID
- `store_id`: Required, must be valid UUID, user must own the store
- `group_price`: Required, must be positive number
- `target_quantity`: Required, must be positive integer
- `end_date`: Required, must be valid ISO date string

#### PUT /api/v1/group-buy/:id
Mengupdate kampanye patungan (Dilindungi - Hanya pemilik toko)

**Request Body (parsial):**
```json
{
  "group_price": 18000,
  "target_quantity": 60,
  "end_date": "2025-08-20T23:59:59Z"
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
    "group_price": 18000,
    "target_quantity": 60,
    "current_quantity": 25,
    "start_date": "2024-03-01T00:00:00Z",
    "end_date": "2025-08-20T23:59:59Z",
    "status": "active",
    "created_at": "2024-03-01T00:00:00Z",
    "updated_at": "2024-03-01T10:30:00Z"
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
  "quantity": 10,
  "payment_method": "QRIS"
}
```

**Response:**
```json
{
  "message": "Successfully joined the campaign",
  "participation": {
    "id": "uuid",
    "campaign_id": "uuid",
    "user_id": "uuid",
    "quantity": 10,
    "total_price": 200000,
    "payment_status": "pending",
    "created_at": "2024-03-01T10:00:00Z"
  },
  "payment_details": {
    "reference": "T123456789",
    "checkout_url": "https://tripay.co.id/checkout/T123456789",
    "qr_string": "00020101021226..."
  }
}
```

**Validation Rules:**
- `quantity`: Required, must be positive integer
- `payment_method`: Optional, string for payment method preference
- User cannot join the same campaign twice
- Campaign must be active and not expired

## Flow Aplikasi

### 1. Setup Awal
1. **Buat Profile User:**
   - User register/login melalui Supabase Auth
   - Profile otomatis dibuat via database trigger `handle_new_user()`

2. **Buat Toko (Untuk Seller):**
   - POST `/api/v1/stores/create` dengan access token
   - User otomatis menjadi seller (`is_seller = true`)

### 2. Flow Patungan Panen (Group Buy)

#### A. Membuat Kampanye (Seller):
1. Seller login dan dapatkan access token
2. Pastikan seller memiliki toko dan produk
3. POST `/api/v1/group-buy` dengan detail kampanye:
   ```json
   {
     "product_id": "uuid",
     "store_id": "uuid", 
     "group_price": 20000,
     "target_quantity": 50,
     "end_date": "2025-08-15T23:59:59Z"
   }
   ```
4. Kampanye dibuat dengan status "active"

#### B. Bergabung Kampanye (Buyer):
1. User login dan dapatkan access token
2. Lihat daftar kampanye: GET `/api/v1/group-buy`
3. Lihat detail kampanye: GET `/api/v1/group-buy/:id`
4. Bergabung kampanye: POST `/api/v1/group-buy/:id/join`
   ```json
   {
     "quantity": 10,
     "payment_method": "QRIS"
   }
   ```
5. Sistem membuat record partisipasi dan link pembayaran TriPay
6. User melakukan pembayaran melalui link yang diberikan

#### C. Proses Pembayaran:
1. TriPay mengirim webhook ke `/api/v1/payments/webhook`
2. Sistem memvalidasi signature dan pembayaran
3. Jika sukses:
   - Update `payment_status` participant menjadi "paid"
   - Update `current_quantity` kampanye
   - Kirim notifikasi ke participant dan seller

#### D. Penyelesaian Kampanye:
1. Sistem mengecek kampanye yang berakhir (dapat diimplementasi dengan cron job)
2. Jika `current_quantity >= target_quantity`:
   - Status kampanye menjadi "successful"
   - Buat pesanan untuk semua participant yang sudah bayar
   - Kirim notifikasi sukses
3. Jika gagal mencapai target:
   - Status kampanye menjadi "failed"
   - Proses refund untuk semua participant
   - Kirim notifikasi kegagalan

### 3. Membuat Pesanan Langsung
1. User menambahkan produk ke keranjang (implementasi frontend)
2. POST `/api/v1/orders/create_from_cart` dengan token
3. Sistem membuat pesanan dan mengembalikan link pembayaran TriPay
4. User melakukan pembayaran melalui TriPay

### 4. Setup Notifikasi Push (Frontend)

1. **Register Service Worker:**
```javascript
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
  applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY'
});

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
  if (event.notification.data?.url) {
    clients.openWindow(event.notification.data.url);
  }
});
```

## Error Handling

Semua endpoint mengembalikan error dalam format standar:

### Validation Errors (400)
```json
{
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "product_id": ["Required"],
      "group_price": ["Required"]
    }
  }
}
```

### Authentication Errors (401)
```json
{
  "message": "Unauthorized: No token provided"
}
```

### Authorization Errors (403)
```json
{
  "message": "Unauthorized: Not the store owner"
}
```

### Not Found Errors (404)
```json
{
  "message": "Campaign not found"
}
```

### Server Errors (500)
```json
{
  "message": "Failed to create campaign",
  "error": "Database connection error"
}
```

## Status Codes
- `200`: OK
- `201`: Created
- `400`: Bad Request (Validation Error)
- `401`: Unauthorized (Authentication Required)
- `403`: Forbidden (Authorization Failed)
- `404`: Not Found
- `500`: Internal Server Error
- `501`: Not Implemented

## Testing

### Prerequisites
1. Supabase project dengan database schema yang benar
2. User account untuk testing (email + password)
3. Server berjalan di `http://localhost:8080`

### Testing Sequence

#### 1. Authentication Test
```bash
# Login dan dapatkan token
curl -X POST "https://your-project.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test endpoint dengan token
curl -X GET "http://localhost:8080/api/v1/group-buy" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 2. Group Buy Flow Test
```bash
# 1. Buat store (jika belum ada)
curl -X POST "http://localhost:8080/api/v1/stores/create" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"store_name": "Test Store", "description": "Store for testing"}'

# 2. Buat kampanye Group Buy
curl -X POST "http://localhost:8080/api/v1/group-buy" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "store_id": "STORE_UUID",
    "group_price": 20000,
    "target_quantity": 50,
    "end_date": "2025-08-15T23:59:59Z"
  }'

# 3. Bergabung kampanye
curl -X POST "http://localhost:8080/api/v1/group-buy/CAMPAIGN_ID/join" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10, "payment_method": "QRIS"}'

# 4. Lihat detail kampanye
curl -X GET "http://localhost:8080/api/v1/group-buy/CAMPAIGN_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### PowerShell Testing (Windows)
```powershell
# Test authentication
$token = "YOUR_ACCESS_TOKEN"
$headers = @{"Authorization" = "Bearer $token"}

Invoke-WebRequest -Uri "http://localhost:8080/api/v1/group-buy" -Headers $headers

# Test create campaign
$body = @{
  product_id = "PRODUCT_UUID"
  store_id = "STORE_UUID"  
  group_price = 20000
  target_quantity = 50
  end_date = "2025-08-15T23:59:59Z"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/v1/group-buy" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

## Database Schema Reference

### Key Tables
- `profiles`: User profiles dengan `is_seller` flag
- `stores`: Toko dengan `owner_id` reference ke profiles
- `products`: Produk dengan `store_id` reference ke stores  
- `group_buy_campaigns`: Kampanye patungan
- `group_buy_participants`: Partisipasi user dalam kampanye
- `orders`: Pesanan yang dibuat
- `device_tokens`: Token untuk push notifications

### Important Relationships
- User → Profile (1:1, auto-created via trigger)
- Profile → Stores (1:many, seller dapat memiliki multiple stores)
- Store → Products (1:many)
- Product → Group Buy Campaigns (1:many)
- Campaign → Participants (1:many)
- User → Participants (1:many)

## Notes & Best Practices

### Security
- ✅ Authentication menggunakan Supabase built-in JWT validation
- ✅ Row Level Security (RLS) aktif di semua tabel
- ✅ Authorization checks di setiap protected endpoint
- ✅ Input validation menggunakan Zod schemas

### Performance
- Database indexes pada foreign keys
- Pagination untuk endpoint yang mengembalikan list (dapat diimplementasi)
- Caching untuk data yang sering diakses (dapat diimplementasi)

### Monitoring
- Error logging dengan detail yang cukup
- Health check endpoint tersedia
- Request/response logging (dapat ditambahkan)

### Development
- Environment variables untuk semua konfigurasi
- Modular code structure untuk maintainability
- TypeScript untuk type safety
- Consistent error response format

### Production Considerations
- HTTPS wajib untuk Web Push API
- Rate limiting untuk endpoint subscribe/unsubscribe
- Database connection pooling
- Proper error monitoring (Sentry, etc.)
- Backup strategy untuk database
- CI/CD pipeline untuk deployment 