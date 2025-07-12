# PanenHub Backend Monolith

Backend monolith untuk PanenHub - Platform e-commerce multi-vendor untuk produk pertanian.

## 🌐 Production URLs

**🚀 Live API:** `https://panenhub-backend-49479616918.us-central1.run.app`

**📋 API Documentation:** Lihat [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)

**🔗 Health Check:** [https://panenhub-backend-49479616918.us-central1.run.app/health](https://panenhub-backend-49479616918.us-central1.run.app/health)

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
│   ├── payments/      # Modul pembayaran
│   ├── notifications/ # Modul notifikasi push
│   └── groupbuy/      # Modul patungan panen
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
- VAPID keys (untuk web push notifications)

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

Server akan berjalan di `http://localhost:8080`

## 🔧 Available Scripts

- `npm run dev` - Start development server dengan hot reload
- `npm run build` - Build aplikasi untuk production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests dengan watch mode
- `npm run test:unit` - Run unit tests saja
- `npm run test:integration` - Run integration tests saja
- `npm run lint` - Run linter
- `npm run clean` - Clean build directory

## 📡 API Endpoints

### Health Check
- `GET /health` - Status aplikasi

### Auth Module
- `GET /api/v1/auth/status` - Status modul auth

### Stores Module
- `GET /api/v1/stores` - Daftar semua toko
- `GET /api/v1/stores/:id` - Detail toko
- `POST /api/v1/stores/create` - Buat toko baru (requires auth)
- `PUT /api/v1/stores/update/:storeId` - Update toko (requires auth)
- `DELETE /api/v1/stores/delete/:storeId` - Hapus toko (requires auth)

### Products Module
- `GET /api/v1/products` - Daftar produk dengan filter & search
- `GET /api/v1/products/:id` - Detail produk
- `POST /api/v1/products` - Buat produk baru (requires auth)
- `PUT /api/v1/products/:id` - Update produk (requires auth)
- `DELETE /api/v1/products/:id` - Hapus produk (requires auth)

### Orders Module
- `POST /api/v1/orders/create_from_cart` - Buat pesanan dari keranjang (requires auth)
- `PUT /api/v1/orders/:orderId/status` - Update status pesanan (requires auth)

### Payments Module
- `POST /api/v1/payments/webhook` - Webhook TriPay
- `POST /api/v1/payments/create-transaction` - Test endpoint untuk buat transaksi

### Notifications Module
- `POST /api/v1/notifications/subscribe` - Subscribe to push notifications (requires auth)
- `DELETE /api/v1/notifications/unsubscribe` - Unsubscribe from push notifications (requires auth)
- `POST /api/v1/notifications/send-internal` - Internal endpoint untuk Edge Functions
- `POST /api/v1/notifications/test-subscribe` - Test subscribe (development only)
- `POST /api/v1/notifications/test-notification` - Test notification (development only)

### Group Buy Module (Patungan Panen)
- `GET /api/v1/group-buy` - Daftar kampanye patungan aktif
- `GET /api/v1/group-buy/:id` - Detail kampanye patungan
- `POST /api/v1/group-buy` - Buat kampanye patungan (requires auth)
- `PUT /api/v1/group-buy/:id` - Update kampanye patungan (requires auth)
- `DELETE /api/v1/group-buy/:id` - Hapus kampanye patungan (requires auth)
- `POST /api/v1/group-buy/:id/join` - Bergabung dengan kampanye (requires auth)

## 🔐 Authentication

Aplikasi menggunakan Supabase untuk otentikasi. Token JWT dari Supabase digunakan untuk mengakses endpoint yang memerlukan autentikasi.

Header format:
```
Authorization: Bearer <supabase-jwt-token>
```

## 🗄️ Database

Aplikasi menggunakan Supabase (PostgreSQL) sebagai database utama. Struktur tabel mengikuti dokumentasi di `02-TECHNICAL-ARCHITECTURE.md`.

### Database Migrations
Jalankan migration files secara berurutan:
```bash
# 1. Schema utama
sql/migrations/000.sql

# 2. Device tokens untuk push notifications
sql/migrations/001_create_device_tokens_table.sql

# 3. Group Buy tables
sql/migrations/002_create_group_buy_tables.sql

# 4. Stored procedures
sql/migrations/003_create_increment_campaign_quantity_function.sql
sql/migrations/004_create_failed_payment_function.sql

# 5. Automation setup
sql/migrations/005_setup_group_buy_automation.sql

# 6. Full-text search
sql/migrations/006_setup_products_search.sql
```

## 🔒 Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang diperlukan.

### Required Variables:
```env
# Server Configuration
PORT=8080
FRONTEND_URL=https://your-frontend-url.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# TriPay Configuration
TRIPAY_API_KEY=your_tripay_api_key_here
TRIPAY_PRIVATE_KEY=your_tripay_private_key_here
TRIPAY_MERCHANT_CODE=your_tripay_merchant_code_here

# Web Push Notification Configuration
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

## 🚀 Deployment

### Production Deployment (Google Cloud Run)

**Current Production:** `https://panenhub-backend-49479616918.us-central1.run.app`

#### Prerequisites:
- Google Cloud Platform account
- gcloud CLI installed and authenticated
- Docker installed

#### Step-by-Step Deployment:

1. **Setup Google Cloud Project:**
```bash
gcloud config set project panenhub-mvp
gcloud auth application-default set-quota-project panenhub-mvp
```

2. **Enable Required Services:**
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

3. **Build Docker Image:**
```bash
docker build -t panenhub-backend .
```

4. **Tag and Push to Container Registry:**
```bash
docker tag panenhub-backend gcr.io/panenhub-mvp/panenhub-backend
gcloud auth configure-docker
docker push gcr.io/panenhub-mvp/panenhub-backend
```

5. **Deploy to Cloud Run:**
```bash
gcloud run deploy panenhub-backend \
  --image gcr.io/panenhub-mvp/panenhub-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
```

6. **Set Environment Variables:**
```bash
gcloud run services update panenhub-backend \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production,SUPABASE_URL=your_url,SUPABASE_ANON_KEY=your_key,SUPABASE_SERVICE_ROLE_KEY=your_key,TRIPAY_API_KEY=your_key,TRIPAY_PRIVATE_KEY=your_key,TRIPAY_MERCHANT_CODE=your_code,VAPID_PUBLIC_KEY=your_key,VAPID_PRIVATE_KEY=your_key,FRONTEND_URL=your_frontend_url"
```

#### Alternative: Using Cloud Build (Automated)
```bash
gcloud builds submit . --tag gcr.io/panenhub-mvp/panenhub-backend
gcloud run deploy panenhub-backend --image gcr.io/panenhub-mvp/panenhub-backend --region us-central1
```

### Local Development with Docker

```bash
# Build image
docker build -t panenhub-backend .

# Run container
docker run -p 8080:8080 --env-file .env panenhub-backend
```

### Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

## 🔧 Supabase Edge Functions Deployment

Untuk fitur otomatisasi Group Buy, deploy Edge Functions:

```bash
# Deploy complete group buy campaigns function
npx supabase functions deploy complete-group-buy-campaigns

# Deploy send notification function
npx supabase functions deploy send-notification
```

Lihat `supabase/deploy-automation.md` untuk instruksi lengkap.

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
4. Tambahkan tests di `__tests__/` directory

### Code Style

- Gunakan TypeScript strict mode
- Follow ESLint rules
- Gunakan async/await untuk operasi async
- Implementasikan proper error handling
- Gunakan Zod untuk input validation
- Implementasikan middleware untuk authorization

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm test -- products.routes.test.ts

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring & Logging

### Health Checks
- **Endpoint:** `/health`
- **Response:** `{"status":"OK","timestamp":"2024-03-01T10:00:00.000Z"}`

### Logging
- Production: JSON structured logs
- Development: Pretty printed logs dengan pino-pretty
- Request/response logging dengan pino-http

### Error Tracking
- Structured error responses
- Error logging dengan context
- HTTP status codes yang konsisten

## 🔒 Security Features

- ✅ JWT Authentication via Supabase
- ✅ Row Level Security (RLS) di database
- ✅ Input validation dengan Zod
- ✅ Authorization middleware
- ✅ CORS configuration
- ✅ Request signature validation (TriPay webhook)
- ✅ Environment variable protection

## 📚 Documentation

- [API Documentation](./API-DOCUMENTATION.md) - Complete API reference
- [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md) - System design
- [Backend Modules](./03-BACKEND-MODULES.md) - Module specifications
- [Implementation Roadmap](./04-IMPLEMENTATION-ROADMAP.md) - Development timeline
- [Payment Gateway Integration](./05-PAYMENT-GATEWAY-INTEGRATION.md) - TriPay integration
- [Common Patterns](./06-COMMON-PATTERNS-AND-RECIPES.md) - Code patterns
- [Testing Guide](./TESTING-GUIDE.md) - Testing strategies

## 🚨 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Supabase RLS policies enabled
- [ ] TriPay webhook configured
- [ ] VAPID keys generated
- [ ] Domain mapping (optional)
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd PanenHub-Backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan kredensial development

# Run development server
npm run dev

# Run tests
npm test
```

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 📞 Support

Untuk pertanyaan atau masalah:
- **Email:** dzakwanalifi@apps.ipb.ac.id
- **GitHub Issues:** [Create Issue](https://github.com/dzakwanalifi/PanenHub-BE/issues)
- **Documentation:** [API Docs](./API-DOCUMENTATION.md)

---

**🌱 PanenHub - Connecting Farmers to Markets** 