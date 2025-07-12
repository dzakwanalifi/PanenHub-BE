import express from 'express';
import request from 'supertest';
import { supabase } from '../../../core/supabaseClient';
import notificationsRouter from '../notifications.routes';
import { cleanupTestUser } from '../../../__tests__/helpers/auth.helper';

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notificationsRouter);

describe('Notifications Routes', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    const email = `test-${Date.now()}@example.com`;
    const password = 'testpassword123';
    
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) throw error;
    testUser = user;

    // Get auth token
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) throw loginError;
    authToken = session!.access_token;
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
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
      const response = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: { invalid: 'data' } });

      expect(response.status).toBe(400);
    });

    it('should save valid subscription', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validSubscription);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Subscription saved successfully.');

      // Verify data was saved
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', testUser.id);

      expect(tokens).toHaveLength(1);
      expect(tokens![0].token_info).toEqual(validSubscription.token);
    });

    it('should prevent duplicate subscriptions', async () => {
      // Try to save the same subscription again
      const response = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validSubscription);

      expect(response.status).toBe(201);

      // Verify no duplicate was created
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', testUser.id);

      expect(tokens).toHaveLength(1);
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
      const response = await request(app)
        .delete('/api/v1/notifications/unsubscribe')
        .set('Authorization', `Bearer ${authToken}`)
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

      // Verify data was deleted
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', testUser.id);

      expect(tokens).toHaveLength(0);
    });
  });
}); 