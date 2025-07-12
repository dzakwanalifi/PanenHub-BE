import webpush from 'web-push';
import 'dotenv/config';
import { supabase } from '../../core/supabaseClient';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error("VAPID keys must be configured in .env");
}

webpush.setVapidDetails(
  'mailto:dzakwanalifi@apps.ipb.ac.id', // Email for VAPID
  vapidPublicKey,
  vapidPrivateKey
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: {
    url: string; // URL to open when notification is clicked
  };
}

// Function to send notification to a single user
export const sendNotificationToUser = async (userId: string, payload: NotificationPayload) => {
  try {
    // 1. Get all device tokens for the user from DB
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token_info')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching device tokens:', error);
      return;
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No device tokens found for user: ${userId}`);
      return;
    }

    // 2. Send notification to each device
    const notificationPromises = tokens.map(tokenRecord => {
      const subscription = tokenRecord.token_info; // token_info is the push subscription object
      return webpush.sendNotification(subscription, JSON.stringify(payload))
        .catch(err => {
          // If subscription is no longer valid (e.g., user cleared cache), remove from DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Subscription for user ${userId} expired. Deleting...`);
            return supabase.from('device_tokens').delete().eq('token_info', subscription);
          } else {
            console.error('Error sending notification:', err);
          }
        });
    });

    await Promise.all(notificationPromises);
    console.log(`Successfully sent notifications to user ${userId}`);
  } catch (error) {
    console.error('Error in sendNotificationToUser:', error);
  }
};

// Function to send notification to multiple users
export const sendNotificationToUsers = async (userIds: string[], payload: NotificationPayload) => {
  try {
    const promises = userIds.map(userId => sendNotificationToUser(userId, payload));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error in sendNotificationToUsers:', error);
  }
}; 