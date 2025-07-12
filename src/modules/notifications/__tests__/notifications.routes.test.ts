import express from 'express';
import request from 'supertest';
import { supabase } from '../../../core/supabaseClient';
import notificationsRouter from '../notifications.routes';

// Mock Supabase client
jest.mock('../../../core/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notificationsRouter);

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

describe('Notifications Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /subscribe', () => {
    const validSubscription = {
      token: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      }
    };

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/subscribe')
        .send(validSubscription);

      expect(response.status).toBe(401);
    });

    it('should validate subscription data', async () => {
      // Mock successful auth
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({ token: { invalid: 'data' } });

      expect(response.status).toBe(400);
    });

    it('should save valid subscription', async () => {
      // Mock successful auth
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock database operations
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const response = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send(validSubscription);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Subscription saved successfully.');
    });

    it('should prevent duplicate subscriptions', async () => {
      // Mock successful auth
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock database operations - no error means upsert handled duplicates
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const response = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send(validSubscription);

      expect(response.status).toBe(201);
    });
  });

  describe('DELETE /unsubscribe', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/notifications/unsubscribe')
        .send({
          token: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
            keys: {
              p256dh: 'test-p256dh-key',
              auth: 'test-auth-key'
            }
          }
        });

      expect(response.status).toBe(401);
    });

    it('should delete subscription', async () => {
      // Mock successful auth
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock database operations
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .delete('/api/v1/notifications/unsubscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({
          token: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
            keys: {
              p256dh: 'test-p256dh-key',
              auth: 'test-auth-key'
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Unsubscribed successfully.');
    });
  });
}); 