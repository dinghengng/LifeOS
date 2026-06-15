const admin = require('../config/firebase');
const webpush = require('web-push');
const db = require('../db');

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function isQuietHours(quietStart, quietEnd) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  if (start > end) return current >= start || current < end; // overnight
  return current >= start && current < end;
}

async function sendToUser(userId, { title, body, type, url = '/' }) {
  const { rows: [prefs] } = await db.query(
    'SELECT * FROM notification_preferences WHERE user_id = $1', [userId]
  );

  if (prefs && isQuietHours(prefs.quiet_start, prefs.quiet_end)) return;

  const { rows: tokens } = await db.query(
    'SELECT * FROM device_tokens WHERE user_id = $1 AND is_active = true', [userId]
  );

  for (const device of tokens) {
    let status = 'sent';
    try {
      if (device.platform === 'web') {
        await webpush.sendNotification(
          JSON.parse(device.token),
          JSON.stringify({ title, body, url })
        );
      } else {
        await admin.messaging().send({
          notification: { title, body },
          token: device.token,
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default' } } }
        });
      }
    } catch (err) {
      status = 'failed';
      if (
        err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/registration-token-not-registered'
      ) {
        await db.query(
          'UPDATE device_tokens SET is_active = false WHERE id = $1', [device.id]
        );
      }
    }

    await db.query(
      `INSERT INTO notification_log (user_id, token_id, type, title, body, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, device.id, type, title, body, status]
    );
  }
}

module.exports = { sendToUser };