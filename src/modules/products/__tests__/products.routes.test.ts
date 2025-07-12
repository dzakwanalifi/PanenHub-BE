// file: src/modules/products/__tests__/products.routes.test.ts

import request from 'supertest';
import express from 'express';
import { supabase } from '../../../core/supabaseClient';
import productsRouter from '../products.routes';

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
app.use('/api/v1/products', productsRouter);

// Mock data
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
};

const mockStore = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  owner_id: '550e8400-e29b-41d4-a716-446655440000',
  store_name: 'Test Store',
};

const mockProduct = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  store_id: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Test Product',
  description: 'Test Description',
  price: 10000,
  unit: 'kg',
  stock: 50,
};

// -- TEST SUITE --
describe('Products API - /api/v1/products', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Berhasil mendapatkan semua produk (public endpoint)
  it('should get all products successfully', async () => {
    // Mock database operations
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockResolvedValue({
      data: [mockProduct],
      error: null,
    });

    const response = await request(app)
      .get('/api/v1/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockProduct]);
  });

  // Test Case 2: Berhasil mendapatkan detail produk (public endpoint)
  it('should get product details successfully', async () => {
    // Mock database operations
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
      data: mockProduct,
      error: null,
    });

    const response = await request(app)
      .get('/api/v1/products/550e8400-e29b-41d4-a716-446655440002');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProduct);
  });

  // Test Case 3: Gagal mendapatkan produk yang tidak ada
  it('should return 404 for non-existent product', async () => {
    // Mock database operations
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
      data: null,
      error: { message: 'Product not found' },
    });

    const response = await request(app)
      .get('/api/v1/products/non-existent-id');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Product not found');
  });

  // Test Case 4: Gagal membuat produk tanpa otentikasi
  it('should return 401 when creating product without token', async () => {
    const response = await request(app)
      .post('/api/v1/products')
      .send({
        store_id: 'test-store-id',
        title: 'Test Product',
        price: 10000,
        stock: 50,
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No token provided');
  });

  // Test Case 5: Gagal membuat produk dengan data invalid
  it('should return 400 for invalid product data', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', 'Bearer valid-token')
      .send({
        store_id: 'invalid-uuid',
        title: '', // Invalid: empty title
        price: -100, // Invalid: negative price
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  // Test Case 6: Berhasil membuat produk baru
  it('should create a new product successfully', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database operations
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockInsert = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
      const baseOperations = {
        select: mockSelect,
        insert: mockInsert,
      };

      if (tableName === 'stores') {
        mockSelect.mockReturnValue({
          eq: mockEq,
        });
        mockEq.mockReturnValue({
          single: mockSingle,
        });
        mockSingle.mockResolvedValue({
          data: mockStore,
          error: null,
        });
      } else if (tableName === 'products') {
        mockInsert.mockReturnValue({
          select: mockSelect,
        });
        mockSelect.mockReturnValue({
          single: mockSingle,
        });
        mockSingle.mockResolvedValue({
          data: mockProduct,
          error: null,
        });
      }

      return baseOperations;
    });

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', 'Bearer valid-token')
      .send({
        store_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Product',
        description: 'Test Description',
        price: 10000,
        unit: 'kg',
        stock: 50,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockProduct);
  });

  // Test Case 7: Gagal membuat produk karena bukan pemilik toko
  it('should return 403 when creating product for store not owned', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database operations - store owned by different user
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
      data: { ...mockStore, owner_id: '550e8400-e29b-41d4-a716-446655440999' },
      error: null,
    });

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', 'Bearer valid-token')
      .send({
        store_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Product',
        price: 10000,
        stock: 50,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden');
  });

  // Test Case 8: Berhasil update produk
  it('should update product successfully', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database operations
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockUpdate = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    // Mock database operations - simplified approach
    let callCount = 0;
    (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
      callCount++;
      
      if (tableName === 'products') {
        if (callCount === 1) {
          // First call: get product for verification
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockProduct,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Third call: update product
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockProduct, title: 'Updated Product' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      } else if (tableName === 'stores') {
        // Second call: get store for verification
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockStore,
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: jest.fn(),
        update: jest.fn(),
      };
    });

    const response = await request(app)
      .put('/api/v1/products/550e8400-e29b-41d4-a716-446655440002')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Updated Product',
        price: 15000,
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Product');
  });

  // Test Case 9: Berhasil hapus produk
  it('should delete product successfully', async () => {
    // Mock successful auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database operations
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockDelete = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
      const baseOperations = {
        select: mockSelect,
        delete: mockDelete,
      };

      if (tableName === 'products') {
        // First call: get product
        mockSelect.mockReturnValueOnce({
          eq: mockEq,
        });
        mockEq.mockReturnValueOnce({
          single: mockSingle,
        });
        mockSingle.mockResolvedValueOnce({
          data: mockProduct,
          error: null,
        });

        // Second call: delete product
        mockDelete.mockReturnValue({
          eq: mockEq,
        });
        mockEq.mockResolvedValue({
          data: null,
          error: null,
        });
      } else if (tableName === 'stores') {
        mockSelect.mockReturnValue({
          eq: mockEq,
        });
        mockEq.mockReturnValue({
          single: mockSingle,
        });
        mockSingle.mockResolvedValue({
          data: mockStore,
          error: null,
        });
      }

      return baseOperations;
    });

    const response = await request(app)
      .delete('/api/v1/products/550e8400-e29b-41d4-a716-446655440002')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product deleted successfully');
  });
}); 