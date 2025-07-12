import request from 'supertest';
import express from 'express';
import { supabase } from '../../../core/supabaseClient';
import groupBuyRouter from '../groupbuy.routes';
import { createTripayTransaction } from '../../payments/payments.service';

// Mock Supabase client
jest.mock('../../../core/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      admin: {
        createUser: jest.fn(),
      },
    },
    from: jest.fn(),
  },
}));

// Mocking the payment service
jest.mock('../../payments/payments.service');
const mockedCreateTripayTransaction = createTripayTransaction as jest.Mock;

// Mock notification service
jest.mock('../../notifications/notifications.service', () => ({
  sendNotificationToUser: jest.fn(),
}));

const app = express();
app.use(express.json());
// Semua endpoint di bawah /api/v1/group-buy akan di-handle oleh router ini
app.use('/api/v1/group-buy', groupBuyRouter);

// Mock data
const mockSeller = {
  id: 'seller-user-id',
  email: 'seller@test.com',
  access_token: 'seller-token',
};

const mockBuyer = {
  id: 'buyer-user-id', 
  email: 'buyer@test.com',
  access_token: 'buyer-token',
};

const mockStore = {
  id: 'test-store-id',
  owner_id: 'seller-user-id',
  store_name: 'Toko Patungan Test',
};

const mockProduct = {
  id: 'test-product-id',
  store_id: 'test-store-id',
  title: 'Produk Patungan',
  price: 100000,
  stock: 100,
};

const mockCampaign = {
  id: 'test-campaign-id',
  product_id: 'test-product-id',
  store_id: 'test-store-id',
  group_price: 80000,
  target_quantity: 10,
  current_quantity: 0,
  status: 'active',
  end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe('Group Buy Module - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test suite untuk pembuatan kampanye
  describe('POST /api/v1/group-buy - Create Campaign', () => {
    it('should fail if user is not authenticated', async () => {
      const response = await request(app).post('/api/v1/group-buy').send({});
      expect(response.status).toBe(401);
    });

    it('should fail if user is not the store owner', async () => {
      // Mock auth for buyer
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockBuyer },
        error: null,
      });

      // Mock store check - store owned by seller, not buyer
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { owner_id: mockSeller.id }, // Different from buyer
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/v1/group-buy')
        .set('Authorization', `Bearer ${mockBuyer.access_token}`)
        .send({
          product_id: mockProduct.id,
          store_id: mockStore.id,
          group_price: 80000,
          target_quantity: 10,
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Unauthorized: Not the store owner');
    });

    it('should create a campaign successfully for the store owner', async () => {
      // Mock auth for seller
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockSeller },
        error: null,
      });

      // Mock database operations with multiple calls
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        callCount++;
        if (table === 'stores') {
          // Store ownership check
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: mockSeller.id },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'group_buy_campaigns') {
          // Campaign creation
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCampaign,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post('/api/v1/group-buy')
        .set('Authorization', `Bearer ${mockSeller.access_token}`)
        .send({
          product_id: mockProduct.id,
          store_id: mockStore.id,
          group_price: 80000,
          target_quantity: 10,
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Campaign created successfully');
      expect(response.body.campaign.product_id).toBe(mockProduct.id);
    });
  });

  // Test suite untuk bergabung ke kampanye
  describe('POST /api/v1/group-buy/:id/join - Join Campaign', () => {
    beforeEach(() => {
        // Reset mock sebelum setiap test
        mockedCreateTripayTransaction.mockReset();
    });

    it('should fail if user is not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/group-buy/${mockCampaign.id}/join`)
        .send({ quantity: 1 });
      expect(response.status).toBe(401);
    });

    it('should allow a buyer to join an active campaign', async () => {
        // Mock auth for buyer
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
          data: { user: mockBuyer },
          error: null,
        });

        // Mock campaign lookup and participant operations
        let callCount = 0;
        (supabase.from as jest.Mock).mockImplementation((table) => {
          callCount++;
          if (table === 'group_buy_campaigns') {
            if (callCount === 1) {
              // First call: get campaign details
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockCampaign,
                      error: null,
                    }),
                  }),
                }),
              };
            }
          } else if (table === 'group_buy_participants') {
            if (callCount === 2) {
              // Second call: create participant
              return {
                insert: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: 'participant-id' },
                      error: null,
                    }),
                  }),
                }),
              };
            } else if (callCount === 3) {
              // Third call: update with tripay reference
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              };
            }
          }
          return {};
        });

        // Mock respons dari TriPay
        mockedCreateTripayTransaction.mockResolvedValue({
            reference: 'TRIPAY-TEST-REF',
            checkout_url: 'https://tripay.co.id/checkout/test-url',
        });

        const response = await request(app)
            .post(`/api/v1/group-buy/${mockCampaign.id}/join`)
            .set('Authorization', `Bearer ${mockBuyer.access_token}`)
            .send({ quantity: 2, payment_method: 'QRIS' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Successfully joined the campaign');
        expect(response.body.payment_details).toBeDefined();
        expect(response.body.payment_details.reference).toBe('TRIPAY-TEST-REF');
        
        // Verifikasi bahwa TriPay dipanggil dengan benar
        expect(mockedCreateTripayTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 160000, // 80000 * 2
                customer_email: mockBuyer.email,
            })
        );
    });

    it('should fail if a user tries to join the same campaign twice', async () => {
        // Mock auth for buyer
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
          data: { user: mockBuyer },
          error: null,
        });

        // Mock existing participation
        (supabase.from as jest.Mock).mockImplementation((table) => {
          if (table === 'group_buy_campaigns') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockCampaign,
                    error: null,
                  }),
                }),
              }),
            };
          } else if (table === 'group_buy_participants') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: 'existing-participant' }, // Already exists
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        });

        const response = await request(app)
            .post(`/api/v1/group-buy/${mockCampaign.id}/join`)
            .set('Authorization', `Bearer ${mockBuyer.access_token}`)
            .send({ quantity: 1 });
        
        expect(response.status).toBe(409); // Conflict
        expect(response.body.message).toBe('You have already joined this campaign');
    });
  });
}); 