import request from 'supertest';
import express from 'express';
import { supabase } from '../../../core/supabaseClient';
import ordersRouter from '../orders.routes';
import { createTripayTransaction } from '../../payments/payments.service';

// --- MOCKING EXTERNAL API ---
// Beritahu Jest untuk mengganti implementasi asli dari payments.service
jest.mock('../../payments/payments.service');
// Casting tipe mock agar TypeScript mengenali metode mock
const mockedCreateTripayTransaction = createTripayTransaction as jest.Mock;

const app = express();
app.use(express.json());
app.use('/api/v1/orders', ordersRouter);

let testUser: any, testUserToken: string;
let testStore: any, testProduct: any, testCart: any;

// Fungsi helper untuk membuat pengguna test
const createTestUser = async () => {
  const email = `test-user-${Date.now()}@panenhub.dev`;
  const password = 'password123';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) throw new Error(`Gagal mendaftar pengguna test: ${signUpError.message}`);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Gagal login pengguna test: ${signInError.message}`);

  return { user: signInData.user, token: signInData.session!.access_token };
};

// --- SETUP & TEARDOWN ---
beforeAll(async () => {
  // 1. Buat pengguna test
  const { user, token } = await createTestUser();
  testUser = user;
  testUserToken = token;

  // 2. Buat toko test secara langsung di DB
  const { data: store } = await supabase
    .from('stores')
    .insert({ owner_id: testUser.id, store_name: 'Toko Uji Coba Checkout' })
    .select()
    .single();
  testStore = store;

  // 3. Buat produk test di DB
  const { data: product } = await supabase
    .from('products')
    .insert({ 
      store_id: testStore.id, 
      title: 'Bayam Segar', 
      price: 5000, 
      stock: 20, 
      unit: 'ikat' 
    })
    .select()
    .single();
  testProduct = product;

  // 4. Ambil keranjang pengguna (seharusnya sudah dibuat oleh trigger)
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', testUser.id)
    .single();
  testCart = cart;
});

afterAll(async () => {
  if (testUser) {
    await supabase.auth.admin.deleteUser(testUser.id);
  }
});

// Kosongkan keranjang sebelum setiap test case untuk memastikan isolasi
beforeEach(async () => {
    mockedCreateTripayTransaction.mockClear();
    await supabase.from('cart_items').delete().eq('cart_id', testCart.id);
});

// --- TEST SUITE ---
describe('Orders API Integration - /api/v1/orders', () => {

  it('Harus berhasil membuat pesanan dari keranjang, memanggil TriPay, dan mengosongkan keranjang', async () => {
    // ARRANGE: Siapkan data di keranjang
    await supabase
      .from('cart_items')
      .insert({ cart_id: testCart.id, product_id: testProduct.id, quantity: 3 });

    // Siapkan MOCK response dari TriPay
    const mockPaymentDetails = {
      checkout_url: 'https://tripay.co.id/checkout/mock-url-12345',
      reference: 'DEV-T12345',
    };
    mockedCreateTripayTransaction.mockResolvedValue(mockPaymentDetails);

    // ACT: Panggil endpoint checkout
    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ payment_method: 'QRIS' });

    // ASSERT: Periksa respons API
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Pesanan berhasil dibuat');
    expect(response.body.payment_details).toEqual(mockPaymentDetails);

    // Pastikan fungsi mock TriPay dipanggil dengan benar
    expect(mockedCreateTripayTransaction).toHaveBeenCalledTimes(1);
    expect(mockedCreateTripayTransaction).toHaveBeenCalledWith(expect.objectContaining({
        amount: 15000, // 3 * 5000
        customer_email: testUser.email
    }));

    // VERIFIKASI DATABASE
    // 1. Periksa apakah pesanan dibuat
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('buyer_id', testUser.id);
    
    expect(orderError).toBeNull();
    expect(orders?.length).toBe(1);
    expect(orders?.[0].total_amount).toBe(15000);
    expect(orders?.[0].order_items.length).toBe(1);
    expect(orders?.[0].order_items[0].quantity).toBe(3);

    // 2. Periksa apakah keranjang sudah kosong
    const { count: cartItemCount } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact' })
      .eq('cart_id', testCart.id);
    
    expect(cartItemCount).toBe(0);
  });

  it('Harus mengembalikan error 400 jika keranjang kosong', async () => {
    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ payment_method: 'QRIS' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Keranjang kosong');
  });

  it('Harus menolak jika tanpa token otentikasi (401 Unauthorized)', async () => {
    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .send({ payment_method: 'QRIS' });

    expect(response.status).toBe(401);
  });
}); 