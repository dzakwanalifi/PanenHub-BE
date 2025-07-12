// file: src/modules/stores/__tests__/stores.routes.test.ts

import request from 'supertest';
import express from 'express';
import { supabase } from '../../../core/supabaseClient';

// Impor router yang akan diuji
import storesRouter from '../stores.routes';

// Mock Supabase client
jest.mock('../../../core/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Buat aplikasi Express mini khusus untuk testing
const app = express();
app.use(express.json());
app.use('/api/v1/stores', storesRouter);

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

const mockStore = {
  id: 'test-store-id',
  owner_id: 'test-user-id',
  store_name: 'Test Store',
  description: 'Test Description',
};

// -- TEST SUITE --
describe('Stores API - /api/v1/stores', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Gagal membuat toko tanpa otentikasi
  it('should return 401 Unauthorized if no token is provided', async () => {
    const response = await request(app)
      .post('/api/v1/stores/create')
      .send({ store_name: 'Toko Gagal' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No token provided');
  });

  // Test Case 2: Gagal membuat toko dengan token invalid
  it('should return 401 Unauthorized for invalid token', async () => {
    // Mock auth.getUser to return error
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const response = await request(app)
      .post('/api/v1/stores/create')
      .set('Authorization', 'Bearer invalid-token')
      .send({ store_name: 'Test Store' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: Invalid token');
  });

  // Test Case 3: Gagal membuat toko dengan data yang tidak valid
  it('should return 400 Bad Request for invalid data', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const response = await request(app)
      .post('/api/v1/stores/create')
      .set('Authorization', 'Bearer valid-token')
      .send({ store_name: '' }); // Nama toko kosong

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  // Test Case 4: Berhasil membuat toko baru
  it('should create a new store successfully', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database operations
    const mockFrom = jest.fn();
    const mockInsert = jest.fn();
    const mockUpdate = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    mockSingle.mockResolvedValue({
      data: mockStore,
      error: null,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await request(app)
      .post('/api/v1/stores/create')
      .set('Authorization', 'Bearer valid-token')
      .send({ store_name: 'Test Store', description: 'Test Description' });

    expect(response.status).toBe(201);
    expect(response.body.store_name).toBe('Test Store');
    expect(response.body.owner_id).toBe('test-user-id');
  });

  // Test Case 5: Gagal update toko tanpa otentikasi
  it('should return 401 Unauthorized when updating store without token', async () => {
    const response = await request(app)
      .put('/api/v1/stores/update/fake-id')
      .send({ store_name: 'Updated Store' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No token provided');
  });

  // Test Case 6: Gagal update toko yang tidak ada
  it('should return 404 when updating non-existent store', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database operations - store not found
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
      data: null,
      error: { message: 'Store not found' },
    });

    const response = await request(app)
      .put('/api/v1/stores/update/non-existent-id')
      .set('Authorization', 'Bearer valid-token')
      .send({ store_name: 'Updated Store' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Store not found');
  });
}); 