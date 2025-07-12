# PanenHub Backend Testing Guide

## Overview

Backend PanenHub memiliki dua jenis test:
1. **Unit Tests** - Test yang menggunakan mock/stub tanpa koneksi database nyata
2. **Integration Tests** - Test yang berinteraksi langsung dengan database Supabase

## Setup Testing Environment

### 1. Install Dependencies
```bash
npm install --save-dev jest supertest ts-jest @types/jest @types/supertest
```

### 2. Environment Variables
Pastikan file `.env` Anda sudah berisi kredensial Supabase yang valid:

```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Database Setup
Sebelum menjalankan integration tests, pastikan:
- Database Supabase sudah disetup dengan schema yang benar
- Fungsi RPC dari `sql-functions.sql` sudah dijalankan
- Anda memiliki akses admin ke database (service role key)

## Menjalankan Tests

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

## Test Structure

### Unit Tests
File: `src/modules/*/tests/*.test.ts`
- Menggunakan mock untuk dependencies
- Tidak berinteraksi dengan database nyata
- Cepat dan ringan

### Integration Tests
File: `src/modules/*/tests/*.integration.test.ts`
- Berinteraksi dengan database Supabase nyata
- Membuat dan menghapus data test
- Lebih lambat tetapi lebih comprehensive

## Integration Test Flow

### 1. Stores Integration Test
```bash
npm run test:integration -- --testNamePattern="Stores"
```

**Test Cases:**
- ✅ Membuat pengguna test baru
- ✅ Test endpoint tanpa autentikasi (401)
- ✅ Test data tidak valid (400)
- ✅ Test pembuatan toko berhasil
- ✅ Verifikasi profil user menjadi seller
- ✅ Cleanup data test

### 2. Orders Integration Test
```bash
npm run test:integration -- --testNamePattern="Orders"
```

**Test Cases:**
- ✅ Setup data test (user, store, product, cart)
- ✅ Test checkout dari keranjang berhasil
- ✅ Mock TriPay payment service
- ✅ Verifikasi pesanan dibuat di database
- ✅ Verifikasi keranjang dikosongkan
- ✅ Test keranjang kosong (400)
- ✅ Cleanup data test

## Best Practices

### 1. Test Isolation
- Setiap test suite membuat pengguna unik
- Data test dibersihkan setelah selesai
- Tidak ada dependency antar test

### 2. Mock External Services
- TriPay API di-mock untuk integration test
- Hindari panggilan API nyata dalam test
- Gunakan data mock yang realistis

### 3. Database Cleanup
```javascript
afterAll(async () => {
  if (testUser) {
    // Hapus user akan menghapus data terkait secara cascade
    await supabase.auth.admin.deleteUser(testUser.id);
  }
});
```

### 4. Timeout Configuration
Integration tests memiliki timeout 30 detik untuk mengakomodasi operasi database.

## Troubleshooting

### Error: "Supabase credentials not found"
- Pastikan file `.env` ada dan berisi kredensial yang benar
- Periksa `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`

### Error: "RPC function not found"
- Jalankan script `sql-functions.sql` di Supabase SQL Editor
- Pastikan semua fungsi RPC sudah dibuat

### Error: "Test timeout"
- Periksa koneksi internet
- Pastikan database Supabase dapat diakses
- Coba tingkatkan timeout di `jest.config.js`

### Error: "Permission denied"
- Pastikan menggunakan service role key, bukan anon key
- Periksa RLS (Row Level Security) di tabel Supabase

## CI/CD Integration

Untuk menjalankan tests di CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Test Coverage

Untuk melihat test coverage:
```bash
npm test -- --coverage
```

Target coverage:
- **Unit Tests**: 80%+ line coverage
- **Integration Tests**: End-to-end flow coverage
- **Critical Paths**: 100% coverage (auth, payments, orders)

## Next Steps

1. Tambahkan integration test untuk products module
2. Tambahkan integration test untuk payments webhook
3. Implementasikan performance testing
4. Setup automated testing di CI/CD 