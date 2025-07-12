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
    rpc: jest.fn(),
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

    // Mock RPC call untuk create_store_and_set_seller
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [mockStore],
      error: null,
    });

    const response = await request(app)
      .post('/api/v1/stores/create')
      .set('Authorization', 'Bearer valid-token')
      .send({ store_name: 'Test Store', description: 'Test Description' });

    expect(response.status).toBe(201);
    expect(response.body[0].store_name).toBe('Test Store');
    expect(response.body[0].owner_id).toBe('test-user-id');
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
    expect(response.body.message).toBe('Toko tidak ditemukan');
  });

  // Test Case 7: Berhasil menghapus toko
  it('should delete store successfully', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock store ownership check
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { owner_id: mockUser.id },
          error: null,
        })
      })
    });

    // Mock delete operations
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: null
      })
    });

    // Mock remaining stores check
    const mockStoresSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    });

    // Mock profile update
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: null
      })
    });

    (supabase.from as jest.Mock).mockImplementation((table) => ({
      select: table === 'stores' ? 
        (mockSelect.mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { owner_id: mockUser.id },
              error: null
            })
          })
        }).mockReturnValueOnce({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })) : mockSelect,
      delete: mockDelete,
      update: mockUpdate
    }));

    const response = await request(app)
      .delete('/api/v1/stores/delete/test-store-id')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Toko berhasil dihapus');
  });

  // Test Case 8: Gagal menghapus toko yang bukan miliknya
  it('should fail to delete store owned by another user', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock store ownership check - different owner
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { owner_id: 'different-user-id' },
          error: null,
        })
      })
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect
    });

    const response = await request(app)
      .delete('/api/v1/stores/delete/test-store-id')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Tidak memiliki akses untuk menghapus toko ini');
  });

}); 