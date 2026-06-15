const express = require('express');
const pool = require('../db');

function createNotificationRouter(requireAuth) {
  const router = express.Router();

  router.post('/register', requireAuth, async (req, res) => {
    try {
      const { token, platform } = req.body;
      if (!token || !platform) {
        return res.status(400).json({ error: 'token and platform are required' });
      }

      const tokenValue = typeof token === 'object' ? JSON.stringify(token) : token;

      await pool.query(`
        INSERT INTO device_tokens (user_id, token, platform)
        VALUES ($1, $2, $3)
        ON CONFLICT (token) DO UPDATE SET last_seen = NOW(), is_active = true
      `, [req.user.id, tokenValue, platform]);

      await pool.query(`
        INSERT INTO notification_preferences (user_id)
        VALUES ($1) ON CONFLICT DO NOTHING
      `, [req.user.id]);

      res.json({ success: true });
    } catch (err) {
      console.error('Register token error:', err.message);
      res.status(500).json({ error: 'Failed to register token' });
    }
  });

  router.get('/preferences', requireAuth, async (req, res) => {
    try {
      const { rows: [prefs] } = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1', [req.user.id]
      );
      res.json(prefs || {});
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  router.put('/preferences', requireAuth, async (req, res) => {
    try {
      const { task_reminders, habit_checkins, lead_time_mins, quiet_start, quiet_end } = req.body;
      await pool.query(`
        INSERT INTO notification_preferences
          (user_id, task_reminders, habit_checkins, lead_time_mins, quiet_start, quiet_end)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          task_reminders = $2,
          habit_checkins = $3,
          lead_time_mins = $4,
          quiet_start = $5,
          quiet_end = $6
      `, [req.user.id, task_reminders, habit_checkins, lead_time_mins, quiet_start, quiet_end]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  return router;
}

module.exports = { createNotificationRouter };