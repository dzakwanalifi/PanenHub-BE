import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase } from '../../core/supabaseClient';
import webpush from 'web-push';

const router = Router();

// Schema for subscription token
const subscribeSchema = z.object({
  token: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

// Endpoint to save notification subscription token (Protected)
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const validation = subscribeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten() });
    }

    const userId = req.user.id;
    const { token } = validation.data;

    // Save or update token in database (upsert)
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        { user_id: userId, token_info: token },
        { onConflict: 'user_id, (token_info->>\'endpoint\')' } // Prevent duplicates
      );

    if (error) throw error;

    res.status(201).json({ message: 'Subscription saved successfully.' });
  } catch (error: any) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ message: 'Failed to save subscription', error: error.message });
  }
});

// Endpoint to unsubscribe from notifications (Protected)
router.delete('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const validation = subscribeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten() });
    }

    const userId = req.user.id;
    const { token } = validation.data;

    // Delete the specific subscription
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token_info->>endpoint', token.endpoint);

    if (error) throw error;

    res.status(200).json({ message: 'Unsubscribed successfully.' });
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Failed to unsubscribe', error: error.message });
  }
});

// Test endpoints untuk development (Development only)
if (process.env.NODE_ENV !== 'production') {
    // Test endpoint untuk subscribe notifikasi
    router.post('/test-subscribe', async (req, res) => {
        try {
            const { token } = req.body;
            
            if (!token || !token.endpoint || !token.keys || !token.keys.p256dh || !token.keys.auth) {
                return res.status(400).json({ 
                    message: 'Invalid token format' 
                });
            }
            
            // Generate unique email using timestamp
            const timestamp = Date.now();
            const testEmail = `test${timestamp}@example.com`;
            
            // Save token to database using service role to bypass RLS
            const { data, error } = await supabase.auth.admin.createUser({
                email: testEmail,
                password: 'test123',
                email_confirm: true
            });

            if (error) throw error;

            const testUserId = data.user.id;
            
            const { error: tokenError } = await supabase
                .from('device_tokens')
                .insert({
                    user_id: testUserId,
                    token_info: token
                });
            
            if (tokenError) throw tokenError;
            
            res.status(201).json({
                message: 'Test subscription successful',
                user_id: testUserId,
                test_email: testEmail
            });
        } catch (error: any) {
            console.error('Test subscription error:', error);
            res.status(500).json({ 
                message: 'Failed to save test subscription',
                error: error.message 
            });
        }
    });

    // Test endpoint untuk mengirim notifikasi
    router.post('/test-notification', async (req, res) => {
        try {
            const testMessage = {
                title: 'Test Notification',
                body: 'This is a test notification from the backend',
                data: { url: '/test' }
            };
            
            // Get all device tokens from database using service role to bypass RLS
            const { data: tokens, error: tokenError } = await supabase
                .from('device_tokens')
                .select('token_info');
            
            if (tokenError) throw tokenError;
            
            if (!tokens || tokens.length === 0) {
                return res.status(404).json({ 
                    message: 'No device tokens found. Please subscribe to notifications first.' 
                });
            }
            
            // Send test notification to all devices
            const results = await Promise.allSettled(
                tokens.map(token => 
                    webpush.sendNotification(token.token_info, JSON.stringify(testMessage))
                )
            );
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            res.status(200).json({
                message: `Notifications sent: ${successful} successful, ${failed} failed`,
                details: results
            });
        } catch (error: any) {
            console.error('Test notification error:', error);
            res.status(500).json({ 
                message: 'Failed to send test notification',
                error: error.message 
            });
        }
    });
}

export default router; 