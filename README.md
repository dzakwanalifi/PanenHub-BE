# PanenHub Backend Monolith

Backend monolith untuk PanenHub - Platform e-commerce multi-vendor untuk produk pertanian.

## 🏗️ Arsitektur

Aplikasi ini menggunakan pendekatan **Monolith Terstruktur** dengan struktur modular yang memungkinkan evolusi ke microservices di masa depan.

### Struktur Direktori

```
src/
├── modules/
│   ├── auth/          # Modul otentikasi
│   ├── stores/        # Modul manajemen toko
│   ├── products/      # Modul manajemen produk
│   ├── orders/        # Modul manajemen pesanan
│   └── payments/      # Modul pembayaran
├── core/
│   ├── middleware/    # Middleware Express
│   ├── utils/         # Utility functions
│   └── supabaseClient.ts
└── index.ts           # Entry point aplikasi
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm atau yarn
- Supabase project
- TriPay account (untuk pembayaran)

### Installation

1. Clone repository
```bash
git clone <repository-url>
cd PanenHub-Backend
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env dengan kredensial yang sesuai
```

4. Start development server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:8000`

## 🔧 Available Scripts

- `npm run dev` - Start development server dengan hot reload
- `npm run build` - Build aplikasi untuk production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter

## 📡 API Endpoints

### Health Check
- `GET /health` - Status aplikasi

### Auth Module
- `GET /api/auth/status` - Status modul auth

### Stores Module
- `GET /api/stores` - Daftar semua toko
- `GET /api/stores/:id` - Detail toko
- `POST /api/stores/create` - Buat toko baru (requires auth)
- `PUT /api/stores/:id` - Update toko (requires auth)

### Products Module
- `GET /api/products` - Daftar produk
- `GET /api/products/:id` - Detail produk

### Orders Module
- `GET /api/orders` - Daftar pesanan
- `POST /api/orders/create_from_cart` - Buat pesanan dari keranjang

### Payments Module
- `POST /api/payments/webhook` - Webhook TriPay
- `GET /api/payments/status` - Status modul pembayaran

## 🔐 Authentication

Aplikasi menggunakan Supabase untuk otentikasi. Token JWT dari Supabase digunakan untuk mengakses endpoint yang memerlukan autentikasi.

Header format:
```
Authorization: Bearer <supabase-jwt-token>
```

## 🗄️ Database

Aplikasi menggunakan Supabase (PostgreSQL) sebagai database utama. Struktur tabel mengikuti dokumentasi di `02-TECHNICAL-ARCHITECTURE.md`.

## 🔒 Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang diperlukan.

Key variables:
- `SUPABASE_URL` - URL Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key untuk operasi backend
- `TRIPAY_API_KEY` - API key TriPay
- `TRIPAY_PRIVATE_KEY` - Private key TriPay
- `FRONTEND_URL` - URL frontend untuk CORS

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t panenhub-backend .

# Run container
docker run -p 8000:8000 --env-file .env panenhub-backend
```

### Google Cloud Run

```bash
# Build dan deploy
gcloud builds submit . --tag gcr.io/PROJECT-ID/panenhub-backend
gcloud run deploy panenhub-backend --image gcr.io/PROJECT-ID/panenhub-backend
```

## 📝 Development Guidelines

### Error Handling

Semua error menggunakan format standar:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Adding New Modules

1. Buat direktori di `src/modules/`
2. Tambahkan `*.routes.ts` dan `*.service.ts`
3. Import dan daftarkan router di `src/index.ts`

### Code Style

- Gunakan TypeScript strict mode
- Follow ESLint rules
- Gunakan async/await untuk operasi async
- Implementasikan proper error handling

## 📚 Documentation

- [Technical Architecture](../02-TECHNICAL-ARCHITECTURE.md)
- [Backend Modules](../03-BACKEND-MODULES.md)
- [Implementation Roadmap](../04-IMPLEMENTATION-ROADMAP.md)
- [Common Patterns](../06-COMMON-PATTERNS-AND-RECIPES.md)

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail. 