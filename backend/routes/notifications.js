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
        `SELECT np.*, u.email 
        FROM notification_preferences np 
        JOIN users u ON u.id = np.user_id 
        WHERE np.user_id = $1`,
        [req.user.id]
      );
      res.json(prefs || {});
    } catch (err) {
      console.error('Fetch preferences error:', err.message);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  router.put('/preferences', requireAuth, async (req, res) => {
    try {
      const { task_reminders, habit_checkins, lead_time_mins, quiet_start, quiet_end,
      overdue_tasks, goal_deadlines, streak_risk, streak_milestone, journal_nudge, notifications_enabled } = req.body;
      await pool.query(`
        INSERT INTO notification_preferences
          (user_id, task_reminders, habit_checkins, lead_time_mins, quiet_start, quiet_end,
          overdue_tasks, goal_deadlines, streak_risk, streak_milestone, journal_nudge)
        VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9,$10,$11)
        ON CONFLICT (user_id) DO UPDATE SET
          task_reminders = $2,
          habit_checkins = $3,
          lead_time_mins = $4,
          quiet_start = $5,
          quiet_end = $6,
          overdue_tasks = $7,
          goal_deadlines = $8,
          streak_risk = $9,
          streak_milestone = $10,
          journal_nudge = $11
      `, [req.user.id, task_reminders, habit_checkins, lead_time_mins, quiet_start, quiet_end, overdue_tasks, goal_deadlines,
        streak_risk, streak_milestone, journal_nudge]);

        if (notifications_enabled !== undefined) {
          await pool.query(
            'UPDATE users SET notifications_enabled = $1 WHERE id = $2',
          [notifications_enabled, req.user.id]
          );
        }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // GET the last 30 notis
  router.get('/inbox', requireAuth, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const { rows } = await pool.query(
        `SELECT id, type, params, sent_at, read_at, status
        FROM notification_log
        WHERE user_id = $1
        ORDER BY sent_at DESC
        LIMIT 30`,
        [req.user.id]
      );
      res.json(rows);
    } catch (err) {
      console.error('Inbox fetch error:', err.message);
      res.status(500).json({ error: 'Failed to fetch inbox' });
    }
  });

  // PUT all notis as read
  router.put('/inbox/read-all', requireAuth, async (req, res) => {
    try {
      await pool.query(
        `UPDATE notification_log
        SET read_at = NOW(), status = 'read'
        WHERE user_id = $1 AND read_at IS NULL`,
        [req.user.id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Mark all read error:', err.message);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  });

  // PUT one noti as read
  router.put('/inbox/:id/read', requireAuth, async (req, res) => {
    try {
      await pool.query(
        `UPDATE notification_log
        SET read_at = NOW(), status = 'read'
        WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
        [req.params.id, req.user.id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Mark read error:', err.message);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  });

  return router;
}

module.exports = { createNotificationRouter };