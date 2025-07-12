import request from 'supertest';
import express from 'express';
import { supabase } from '../../../core/supabaseClient';
import storesRouter from '../stores.routes';

// Buat aplikasi mini Express untuk testing
const app = express();
app.use(express.json());
app.use('/api/v1/stores', storesRouter);

// Variabel untuk menyimpan data test antar test case
let testUser: any;
let testUserToken: string;

// --- FUNGSI BANTUAN ---
// Fungsi ini akan membuat pengguna baru di Supabase setiap kali test suite dijalankan.
const createTestUser = async () => {
  const email = `test-user-${Date.now()}@panenhub.dev`;
  const password = 'password123';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) throw new Error(`Gagal mendaftar pengguna test: ${signUpError.message}`);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Gagal login pengguna test: ${signInError.message}`);

  return { user: signInData.user, token: signInData.session!.access_token };
};

// --- JEST HOOKS ---
// Berjalan sekali SEBELUM semua test di file ini dimulai.
beforeAll(async () => {
  const { user, token } = await createTestUser();
  testUser = user;
  testUserToken = token;
});

// Berjalan sekali SETELAH semua test di file ini selesai.
// Tugasnya adalah membersihkan semua data yang dibuat selama test.
afterAll(async () => {
  if (testUser) {
    // Hapus pengguna dari Supabase Auth, ini akan menghapus data terkait secara cascade
    const { error } = await supabase.auth.admin.deleteUser(testUser.id);
    if (error) {
        console.error("Gagal menghapus pengguna test:", error.message);
    }
  }
});

// --- TEST SUITE ---
describe('Stores API Integration - /api/v1/stores', () => {

  it('Harus menolak jika tanpa token otentikasi (401 Unauthorized)', async () => {
    const response = await request(app)
      .post('/api/v1/stores/create')
      .send({ store_name: 'Toko Gagal' });

    expect(response.status).toBe(401);
  });

  it('Harus menolak jika data tidak valid (400 Bad Request)', async () => {
    const response = await request(app)
      .post('/api/v1/stores/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ store_name: '' }); // Nama toko kosong

    expect(response.status).toBe(400);
  });

  it('Harus berhasil membuat toko baru dan mengupdate profil pengguna menjadi penjual', async () => {
    const storeName = `Warung Panen ${Date.now()}`;

    // ACT: Panggil endpoint untuk membuat toko
    const response = await request(app)
      .post('/api/v1/stores/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ store_name: storeName, description: 'Menjual hasil panen segar' });

    // ASSERT: Periksa respons dari API
    expect(response.status).toBe(201);
    expect(response.body[0].store_name).toBe(storeName);
    expect(response.body[0].owner_id).toBe(testUser.id);

    // VERIFIKASI DATABASE: Periksa langsung ke tabel 'profiles'
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_seller')
      .eq('id', testUser.id)
      .single();

    expect(error).toBeNull();
    expect(profile?.is_seller).toBe(true);
  });
}); 