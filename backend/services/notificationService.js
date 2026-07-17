const admin = require('../config/firebase');
const { Expo } = require('expo-server-sdk');
const db = require('../db');

const expo = new Expo();

function isQuietHours(quietStart, quietEnd) {
  if (!quietStart || !quietEnd) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  if (start > end) return current >= start || current < end;
  return current >= start && current < end;
}

async function sendToUser(userId, { title, body, type, params = {}, url = '/' }) {
  const { rows: [prefs] } = await db.query(
    'SELECT * FROM notification_preferences WHERE user_id = $1', [userId]
  );

  if (prefs && isQuietHours(prefs.quiet_start, prefs.quiet_end)) return;

  await db.query(
    `INSERT INTO notification_log (user_id, type, params, status)
     VALUES ($1, $2, $3, 'unread')`,
    [userId, type, JSON.stringify(params)]
  );
  
  const { rows: tokens } = await db.query(
    'SELECT * FROM device_tokens WHERE user_id = $1 AND is_active = true', [userId]
  );

  if (tokens.length === 0) return;

  for (const device of tokens) {
    try {
      if (device.platform === 'web') {
        await admin.messaging().send({
          token: device.token,
          notification: { title, body },
          webpush: {
            notification: { title, body, icon: '/icon-192x192.png' },
            fcmOptions: { link: url }
          }
        });
      } else {
        if (!Expo.isExpoPushToken(device.token)) {
          console.warn(`Invalid Expo token for device ${device.id}`);
          continue;
        }
        const [ticket] = await expo.sendPushNotificationsAsync([{
          to: device.token,
          title,
          body,
          sound: 'default',
          data: { url },
          priority: 'high',
        }]);
        if (ticket.status === 'error') {
          throw new Error(ticket.message);
        }
      }

      console.log(`Notification sent to user ${userId} on device ${device.id}`);
    } catch (err) {
      status = 'failed';
      console.error(`Notification failed for device ${device.id}:`, err.message);
      if (
        err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/registration-token-not-registered'
      ) {
        await db.query(
          'UPDATE device_tokens SET is_active = false WHERE id = $1', [device.id]
        );
      }
    }
  }
}

module.exports = { sendToUser, isQuietHours };