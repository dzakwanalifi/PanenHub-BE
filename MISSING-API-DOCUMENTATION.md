# Missing API Documentation

This document lists API endpoints that are currently being used in the frontend but are not yet documented in the main API documentation.

## Cart Module

### GET /api/v1/cart
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

### POST /api/v1/cart/items
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

### PUT /api/v1/cart/items/:itemId
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

### DELETE /api/v1/cart/items/:itemId
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

## User Profile Module

### GET /api/v1/users/profile
Mendapatkan profil pengguna (Dilindungi)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone_number": "+6281234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_seller": false,
  "created_at": "2024-03-01T00:00:00Z",
  "updated_at": "2024-03-01T00:00:00Z"
}
```

### PUT /api/v1/users/profile
Mengupdate profil pengguna (Dilindungi)

**Example Request:**
```bash
curl -X PUT https://panenhub-backend-49479616918.us-central1.run.app/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone_number": "+6281234567890"
  }'
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone_number": "+6281234567890"
}
```

**Response:**
```json
{
  "message": "Profil berhasil diupdate",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "phone_number": "+6281234567890",
    "updated_at": "2024-03-01T10:30:00Z"
  }
}
```

## Address Module

### GET /api/v1/users/addresses
Mendapatkan daftar alamat pengguna (Dilindungi)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/users/addresses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "label": "Rumah",
    "recipient_name": "John Doe",
    "phone_number": "+6281234567890",
    "address": "Jl. Contoh No. 123",
    "city": "Jakarta",
    "postal_code": "12345",
    "is_default": true,
    "created_at": "2024-03-01T00:00:00Z",
    "updated_at": "2024-03-01T00:00:00Z"
  }
]
```

### POST /api/v1/users/addresses
Menambahkan alamat baru (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/users/addresses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Rumah",
    "recipient_name": "John Doe",
    "phone_number": "+6281234567890",
    "address": "Jl. Contoh No. 123",
    "city": "Jakarta",
    "postal_code": "12345",
    "is_default": true
  }'
```

**Request Body:**
```json
{
  "label": "Rumah",
  "recipient_name": "John Doe",
  "phone_number": "+6281234567890",
  "address": "Jl. Contoh No. 123",
  "city": "Jakarta",
  "postal_code": "12345",
  "is_default": true
}
```

**Response:**
```json
{
  "message": "Alamat berhasil ditambahkan",
  "address": {
    "id": "uuid",
    "label": "Rumah",
    "recipient_name": "John Doe",
    "phone_number": "+6281234567890",
    "address": "Jl. Contoh No. 123",
    "city": "Jakarta",
    "postal_code": "12345",
    "is_default": true,
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
}
```

### PUT /api/v1/users/addresses/:addressId
Mengupdate alamat (Dilindungi)

**Example Request:**
```bash
curl -X PUT https://panenhub-backend-49479616918.us-central1.run.app/api/v1/users/addresses/ADDRESS_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Kantor",
    "address": "Jl. Contoh No. 456"
  }'
```

**Request Body:**
```json
{
  "label": "Kantor",
  "address": "Jl. Contoh No. 456"
}
```

**Response:**
```json
{
  "message": "Alamat berhasil diupdate",
  "address": {
    "id": "uuid",
    "label": "Kantor",
    "address": "Jl. Contoh No. 456",
    "updated_at": "2024-03-01T10:30:00Z"
  }
}
```

### DELETE /api/v1/users/addresses/:addressId
Menghapus alamat (Dilindungi)

**Example Request:**
```bash
curl -X DELETE https://panenhub-backend-49479616918.us-central1.run.app/api/v1/users/addresses/ADDRESS_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "message": "Alamat berhasil dihapus"
}
```

## Messages Module

### GET /api/v1/messages/conversations
Mendapatkan daftar percakapan pengguna (Dilindungi)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/messages/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "participant_id": "uuid",
    "participant": {
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "last_message": {
      "content": "Halo, apakah produk masih tersedia?",
      "created_at": "2024-03-01T10:00:00Z"
    },
    "unread_count": 2,
    "created_at": "2024-03-01T00:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
]
```

### GET /api/v1/messages/conversations/:conversationId
Mendapatkan detail percakapan (Dilindungi)

**Example Request:**
```bash
curl https://panenhub-backend-49479616918.us-central1.run.app/api/v1/messages/conversations/CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "id": "uuid",
  "participant_id": "uuid",
  "participant": {
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "messages": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "content": "Halo, apakah produk masih tersedia?",
      "created_at": "2024-03-01T10:00:00Z"
    }
  ]
}
```

### POST /api/v1/messages/conversations/:conversationId
Mengirim pesan baru (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/messages/conversations/CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Ya, produk masih tersedia"
  }'
```

**Request Body:**
```json
{
  "content": "Ya, produk masih tersedia"
}
```

**Response:**
```json
{
  "message": "Pesan berhasil dikirim",
  "data": {
    "id": "uuid",
    "sender_id": "uuid",
    "content": "Ya, produk masih tersedia",
    "created_at": "2024-03-01T10:30:00Z"
  }
}
```

### POST /api/v1/messages/conversations
Membuat percakapan baru (Dilindungi)

**Example Request:**
```bash
curl -X POST https://panenhub-backend-49479616918.us-central1.run.app/api/v1/messages/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "uuid",
    "initial_message": "Halo, apakah produk masih tersedia?"
  }'
```

**Request Body:**
```json
{
  "participant_id": "uuid",
  "initial_message": "Halo, apakah produk masih tersedia?"
}
```

**Response:**
```json
{
  "message": "Percakapan berhasil dibuat",
  "conversation": {
    "id": "uuid",
    "participant_id": "uuid",
    "messages": [
      {
        "id": "uuid",
        "sender_id": "uuid",
        "content": "Halo, apakah produk masih tersedia?",
        "created_at": "2024-03-01T10:00:00Z"
      }
    ],
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
}
``` 