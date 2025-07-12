# PanenHub Backend API Documentation

## 🌐 Production API

**Base URL:** `https://panenhub-backend-49479616918.us-central1.run.app`

**Health Check:** [https://panenhub-backend-49479616918.us-central1.run.app/health](https://panenhub-backend-49479616918.us-central1.run.app/health)

**API Version:** v1

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
FRONTEND_URL=https://your-frontend-url.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

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
- `sql/migrations/003_create_increment_campaign_quantity_function.sql` - Stored procedures
- `sql/migrations/004_create_failed_payment_function.sql` - Payment handling
- `sql/migrations/005_setup_group_buy_automation.sql` - Automation setup
- `sql/migrations/006_setup_products_search.sql` - Full-text search

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

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/health
```

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

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/auth/status
```

**Response:**
```json
{
  "message": "Auth module is active. Authentication is handled by Supabase directly."
}
```

### 2. Stores Module

#### GET /api/v1/stores
Mendapatkan semua toko (Publik)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/stores
```

**Response:**
```json
[
  {
    "id": "00427037-5ca1-4a12-82d8-7f6b1070b09b",
    "owner_id": "9f9289e7-d78f-40b8-987d-0af92ac6064c",
    "store_name": "Toko Sayur Segar",
    "description": "Toko sayuran organik berkualitas tinggi",
    "banner_url": null,
    "location": null,
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
]
```

#### GET /api/v1/stores/:id
Mendapatkan detail toko (Publik)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/stores/00427037-5ca1-4a12-82d8-7f6b1070b09b
```

**Response:**
```json
{
  "id": "00427037-5ca1-4a12-82d8-7f6b1070b09b",
  "owner_id": "9f9289e7-d78f-40b8-987d-0af92ac6064c",
  "store_name": "Toko Sayur Segar",
  "description": "Toko sayuran organik berkualitas tinggi",
  "banner_url": null,
  "location": null,
  "created_at": "2024-03-01T10:00:00Z",
  "updated_at": "2024-03-01T10:00:00Z"
}
```

#### POST /api/v1/stores/create
Membuat toko baru (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/stores/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Toko Sayur Segar",
    "description": "Toko sayuran organik berkualitas tinggi"
  }'
```

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

**Example Request:**
```bash
curl -X PUT https://panenhub-backend-49479616918.us-central1.run.app/api/v1/stores/update/00427037-5ca1-4a12-82d8-7f6b1070b09b \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Toko Sayur Premium",
    "description": "Toko sayuran organik premium"
  }'
```

**Request Body:**
```json
{
  "store_name": "Toko Sayur Premium",
  "description": "Toko sayuran organik premium"
}
```

#### DELETE /api/v1/stores/delete/:storeId
Menghapus toko (Dilindungi - Hanya pemilik toko)

**Example Request:**
```bash
curl -X DELETE https://panenhub-backend-49479616918.us-central1.run.app/api/v1/stores/delete/00427037-5ca1-4a12-82d8-7f6b1070b09b \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "message": "Toko berhasil dihapus"
}
```

### 3. Products Module

#### GET /api/v1/products
Mendapatkan semua produk dengan filter dan pencarian (Publik)

**Query Parameters:**
- `q` (optional): Search query untuk title dan description
- `minPrice` (optional): Harga minimum
- `maxPrice` (optional): Harga maksimum  
- `storeId` (optional): Filter berdasarkan toko
- `sortBy` (optional): `price_asc`, `price_desc`, `created_at_desc` (default)
- `page` (optional): Halaman, default 1
- `limit` (optional): Jumlah per halaman, default 10, max 100

**Example Request:**
```bash
curl "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/products?q=tomat&minPrice=10000&maxPrice=50000&sortBy=price_asc&page=1&limit=10"
```

**Response:**
```json
{
  "data": [
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
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "hasNextPage": false,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

#### GET /api/v1/products/:id
Mendapatkan detail produk (Publik)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/products/PRODUCT_ID
```

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

#### POST /api/v1/products
Membuat produk baru (Dilindungi - Hanya pemilik toko)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "00427037-5ca1-4a12-82d8-7f6b1070b09b",
    "title": "Tomat Segar",
    "description": "Tomat segar dari petani lokal",
    "price": 15000,
    "unit": "kg",
    "stock": 100
  }'
```

**Request Body:**
```json
{
  "store_id": "uuid",
  "title": "Tomat Segar",
  "description": "Tomat segar dari petani lokal",
  "price": 15000,
  "unit": "kg",
  "stock": 100
}
```

#### PUT /api/v1/products/:id
Mengupdate produk (Dilindungi - Hanya pemilik toko)

**Example Request:**
```bash
curl -X PUT https://panenhub-backend-49479616918.us-central1.run.app/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tomat Premium",
    "price": 20000,
    "stock": 50
  }'
```

#### DELETE /api/v1/products/:id
Menghapus produk (Dilindungi - Hanya pemilik toko)

**Example Request:**
```bash
curl -X DELETE https://panenhub-backend-49479616918.us-central1.run.app/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Cart Module

#### GET /api/v1/cart
Mendapatkan isi keranjang belanja pengguna (Dilindungi)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 2,
      "created_at": "2024-03-01T10:00:00Z",
      "updated_at": "2024-03-01T10:00:00Z",
      "product": {
        "id": "uuid",
        "title": "Tomat Segar",
        "price": 15000,
        "unit": "kg",
        "store_id": "uuid",
        "store": {
          "store_name": "Toko Sayur Segar"
        }
      }
    }
  ],
  "total_price": 30000
}
```

#### POST /api/v1/cart/items
Menambahkan item ke keranjang (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "uuid",
    "quantity": 2
  }'
```

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "message": "Item berhasil ditambahkan ke keranjang",
  "item": {
    "id": "uuid",
    "product_id": "uuid",
    "quantity": 2,
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
}
```

#### PUT /api/v1/cart/items/:itemId
Mengupdate kuantitas item di keranjang (Dilindungi)

**Example Request:**
```bash
curl -X PUT https://panenhub-backend-49479616918.us-central1.run.app/api/v1/cart/items/ITEM_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }'
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "message": "Kuantitas item berhasil diupdate",
  "item": {
    "id": "uuid",
    "product_id": "uuid",
    "quantity": 3,
    "updated_at": "2024-03-01T10:30:00Z"
  }
}
```

#### DELETE /api/v1/cart/items/:itemId
Menghapus item dari keranjang (Dilindungi)

**Example Request:**
```bash
curl -X DELETE https://panenhub-backend-49479616918.us-central1.run.app/api/v1/cart/items/ITEM_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "message": "Item berhasil dihapus dari keranjang"
}
```

### 5. Orders Module

#### POST /api/v1/orders/create_from_cart
Membuat pesanan dari keranjang (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/orders/create_from_cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "QRIS"
  }'
```

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

#### PUT /api/v1/orders/:orderId/status
Mengupdate status pesanan oleh penjual (Dilindungi - Hanya pemilik toko)

**Example Request:**
```bash
curl -X PUT https://panenhub-backend-49479616918.us-central1.run.app/api/v1/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

**Request Body:**
```json
{
  "status": "processing|shipped|delivered|cancelled"
}
```

**Response:**
```json
{
  "message": "Status pesanan berhasil diperbarui",
  "order": {
    "id": "uuid",
    "shipping_status": "shipped",
    "updated_at": "2024-03-01T10:30:00Z"
  }
}
```

### 6. Payments Module

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

**Response:**
```json
{
  "success": true,
  "message": "Webhook received successfully",
  "merchant_ref": "uuid",
  "status": "PAID"
}
```

**Actions:**
- Update status pesanan
- Kirim notifikasi ke seller melalui web push
- Kirim notifikasi ke buyer melalui web push

#### POST /api/v1/payments/create-transaction
Test endpoint untuk membuat transaksi TriPay (Development)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/payments/create-transaction
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "T123456789",
    "checkout_url": "https://tripay.co.id/checkout/T123456789",
    "qr_string": "00020101021226..."
  }
}
```

### 7. Notifications Module

#### POST /api/v1/notifications/subscribe
Mendaftarkan device untuk menerima notifikasi (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/notifications/subscribe \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "base64-encoded-key",
        "auth": "base64-encoded-auth"
      }
    }
  }'
```

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

**Example Request:**
```bash
curl -X DELETE https://panenhub-backend-49479616918.us-central1.run.app/api/v1/notifications/unsubscribe \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "base64-encoded-key",
        "auth": "base64-encoded-auth"
      }
    }
  }'
```

**Response:**
```json
{
  "message": "Unsubscribed successfully."
}
```

#### POST /api/v1/notifications/send-internal
Internal endpoint untuk menerima notifikasi dari Edge Functions

**Headers:**
```
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

**Request Body:**
```json
{
  "userId": "uuid",
  "payload": {
    "title": "Notifikasi Title",
    "body": "Notifikasi body",
    "data": {
      "url": "/path/to/open"
    }
  }
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

### 8. Group Buy Module (Patungan Panen) ✅

#### GET /api/v1/group-buy
Mendapatkan daftar kampanye patungan aktif (Publik)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy
```

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

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy/CAMPAIGN_ID
```

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

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "uuid",
    "store_id": "uuid",
    "group_price": 20000,
    "target_quantity": 50,
    "end_date": "2025-08-15T23:59:59Z"
  }'
```

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

**Example Request:**
```bash
curl -X PUT https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy/CAMPAIGN_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_price": 18000,
    "target_quantity": 60,
    "end_date": "2025-08-20T23:59:59Z"
  }'
```

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

**Example Request:**
```bash
curl -X DELETE https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy/CAMPAIGN_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "message": "Campaign deleted successfully"
}
```

#### POST /api/v1/group-buy/:id/join
Bergabung dengan kampanye patungan (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy/CAMPAIGN_ID/join \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "payment_method": "QRIS"
  }'
```

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
1. Sistem mengecek kampanye yang berakhir (via Supabase Edge Functions)
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

await fetch('https://panenhub-backend-49479616918.us-central1.run.app/api/v1/notifications/subscribe', {
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
3. Production API: `https://panenhub-backend-49479616918.us-central1.run.app`

### Testing Sequence

#### 1. Authentication Test
```bash
# Login dan dapatkan token
curl -X POST "https://your-project.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test endpoint dengan token
curl -X GET "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 2. Group Buy Flow Test
```bash
# 1. Buat store (jika belum ada)
curl -X POST "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/stores/create" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"store_name": "Test Store", "description": "Store for testing"}'

# 2. Buat kampanye Group Buy
curl -X POST "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy" \
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
curl -X POST "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy/CAMPAIGN_ID/join" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10, "payment_method": "QRIS"}'

# 4. Lihat detail kampanye
curl -X GET "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy/CAMPAIGN_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### PowerShell Testing (Windows)
```powershell
# Test authentication
$token = "YOUR_ACCESS_TOKEN"
$headers = @{"Authorization" = "Bearer $token"}

Invoke-WebRequest -Uri "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy" -Headers $headers

# Test create campaign
$body = @{
  product_id = "PRODUCT_UUID"
  store_id = "STORE_UUID"  
  group_price = 20000
  target_quantity = 50
  end_date = "2025-08-15T23:59:59Z"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://panenhub-backend-49479616918.us-central1.run.app/api/v1/group-buy" -Method POST -Headers $headers -Body $body -ContentType "application/json"
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

## Production Deployment

### Current Production Environment
- **URL:** `https://panenhub-backend-49479616918.us-central1.run.app`
- **Platform:** Google Cloud Run
- **Region:** us-central1
- **Configuration:**
  - Memory: 1GB
  - CPU: 1 vCPU
  - Max Instances: 10
  - Port: 8080
  - Environment: Production

### Environment Variables (Production)
Ensure these are set in Cloud Run:
```bash
NODE_ENV=production
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
TRIPAY_API_KEY=your_production_tripay_api_key
TRIPAY_PRIVATE_KEY=your_production_tripay_private_key
TRIPAY_MERCHANT_CODE=your_production_tripay_merchant_code
VAPID_PUBLIC_KEY=your_production_vapid_public_key
VAPID_PRIVATE_KEY=your_production_vapid_private_key
FRONTEND_URL=your_production_frontend_url
```

### Deployment Commands
```bash
# Build and push to Container Registry
docker build -t panenhub-backend .
docker tag panenhub-backend gcr.io/panenhub-mvp/panenhub-backend
docker push gcr.io/panenhub-mvp/panenhub-backend

# Deploy to Cloud Run
gcloud run deploy panenhub-backend \
  --image gcr.io/panenhub-mvp/panenhub-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10

# Update environment variables
gcloud run services update panenhub-backend \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production,SUPABASE_URL=...,SUPABASE_ANON_KEY=...,..."
```

## Notes & Best Practices

### Security
- ✅ Authentication menggunakan Supabase built-in JWT validation
- ✅ Row Level Security (RLS) aktif di semua tabel
- ✅ Authorization checks di setiap protected endpoint
- ✅ Input validation menggunakan Zod schemas
- ✅ CORS configuration untuk frontend integration
- ✅ Webhook signature validation untuk payment security

### Performance
- ✅ Database indexes pada foreign keys
- ✅ Pagination untuk endpoint yang mengembalikan list
- ✅ Efficient query patterns dengan Supabase
- ✅ Structured logging untuk monitoring
- ✅ Health check endpoint untuk load balancer

### Monitoring
- ✅ Error logging dengan detail yang cukup
- ✅ Health check endpoint tersedia
- ✅ Request/response logging dengan pino-http
- ✅ Structured JSON logs untuk production

### Development
- ✅ Environment variables untuk semua konfigurasi
- ✅ Modular code structure untuk maintainability
- ✅ TypeScript untuk type safety
- ✅ Consistent error response format
- ✅ Comprehensive test coverage

### Production Considerations
- ✅ HTTPS enforced by Cloud Run
- ✅ Environment-specific configurations
- ✅ Proper error monitoring setup
- ✅ Database connection pooling via Supabase
- ✅ Scalable architecture with Cloud Run
- ✅ CI/CD ready deployment process

---

**🌱 PanenHub API - Connecting Farmers to Markets**

For support: dzakwanalifi@apps.ipb.ac.id 