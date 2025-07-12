// file: src/modules/orders/__tests__/orders.routes.test.ts

import request from 'supertest';
import express from 'express';
import { supabase } from '../../../core/supabaseClient';
import ordersRouter from '../orders.routes';
import { createTripayTransaction } from '../../payments/payments.service';

// -- MOCKING --
// Mock Supabase client
jest.mock('../../../core/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock payments service
jest.mock('../../payments/payments.service');

// Casting tipe mock
const mockedCreateTripayTransaction = createTripayTransaction as jest.Mock;

const app = express();
app.use(express.json());
app.use('/api/v1/orders', ordersRouter);

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

const mockStore = {
  id: 'test-store-id',
  owner_id: 'test-user-id',
  store_name: 'Test Store',
};

const mockProduct = {
  id: 'test-product-id',
  store_id: 'test-store-id',
  title: 'Test Product',
  price: 10000,
  stock: 10,
  stores: mockStore,
};

const mockCart = {
  id: 'test-cart-id',
  user_id: 'test-user-id',
  cart_items: [
    {
      id: 'test-cart-item-id',
      product_id: 'test-product-id',
      quantity: 2,
      products: mockProduct,
    },
  ],
};

const mockCheckoutSession = {
  id: 'test-session-id',
  user_id: 'test-user-id',
  total_amount: 20000,
};

const mockOrder = {
  id: 'test-order-id',
  checkout_session_id: 'test-session-id',
  buyer_id: 'test-user-id',
  store_id: 'test-store-id',
  total_amount: 20000,
};

// -- TEST SUITE --
describe('Orders API - /api/v1/orders', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Gagal checkout tanpa otentikasi
  it('should return 401 Unauthorized if no token is provided', async () => {
    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .send({ payment_method: 'QRIS' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No token provided');
  });

  // Test Case 2: Gagal checkout dengan token invalid
  it('should return 401 Unauthorized for invalid token', async () => {
    // Mock auth.getUser to return error
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .set('Authorization', 'Bearer invalid-token')
      .send({ payment_method: 'QRIS' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: Invalid token');
  });

  // Test Case 3: Gagal checkout dengan keranjang kosong
  it('should return 400 if cart is empty', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock empty cart
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockSingle.mockResolvedValue({
      data: { id: 'test-cart-id', cart_items: [] }, // Empty cart
      error: null,
    });

    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .set('Authorization', 'Bearer valid-token')
      .send({ payment_method: 'QRIS' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Keranjang kosong atau tidak ditemukan.');
  });

  // Test Case 4: Berhasil checkout dan membuat order
  it('should create an order from cart and return payment details', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock cart data
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockSingle.mockResolvedValue({
      data: mockCart,
      error: null,
    });

    // Mock RPC call untuk create_orders_from_cart
    (supabase.rpc as jest.Mock).mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { checkout_session_id: 'test-session-id', total_amount: 20000 },
        error: null,
      }),
    });

    // Mock TriPay response
    mockedCreateTripayTransaction.mockResolvedValue({
      checkout_url: 'https://tripay.co.id/checkout/mock-url',
      reference: 'MOCK-REF-123',
      amount: 20000,
    });

    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .set('Authorization', 'Bearer valid-token')
      .send({ payment_method: 'QRIS' });

    // Assert: Periksa hasilnya
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Pesanan berhasil dibuat');
    expect(response.body.payment_details).toBeDefined();

    // Pastikan fungsi mock dipanggil
    expect(mockedCreateTripayTransaction).toHaveBeenCalledTimes(1);
  });

  // Test Case 5: Gagal checkout karena error dari payment gateway
  it('should return 500 if payment gateway fails', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock cart data
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockSingle.mockResolvedValue({
      data: mockCart,
      error: null,
    });

    // Mock RPC call untuk create_orders_from_cart
    (supabase.rpc as jest.Mock).mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { checkout_session_id: 'test-session-id', total_amount: 20000 },
        error: null,
      }),
    });

    // Mock TriPay failure
    mockedCreateTripayTransaction.mockRejectedValue(new Error('Payment gateway error'));

    const response = await request(app)
      .post('/api/v1/orders/create_from_cart')
      .set('Authorization', 'Bearer valid-token')
      .send({ payment_method: 'QRIS' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Gagal membuat pesanan');
    expect(response.body.error).toBe('Payment gateway error');
  });
}); 