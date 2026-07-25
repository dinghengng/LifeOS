const express = require('express');
function createDevTestRouter(requireAuth) {
  const router = express.Router();

  if (process.env.NODE_ENV === 'production') {
    router.use((req, res) => res.status(404).end());
    return router;
  }

  const { runOverdueTaskAlerts } = require('../jobs/overdueTaskAlerts');
  const { runGoalDeadlineAlerts } = require('../jobs/goalDeadlineAlerts');
  const { runHabitStreakRiskAlerts } = require('../jobs/habitStreakRiskAlerts');
  const { runStreakMilestones } = require('../jobs/streakMilestones');
  const { runJournalNudge } = require('../jobs/journalNudge');
  const { runWeeklyDigest } = require('../jobs/weeklyDigest');
  const { sendToUser } = require('../services/notificationService');

  router.post('/notifications/direct-send', requireAuth, async (req, res) => {
    const { title, body, type } = req.body;
    try {
      await sendToUser(req.user.id, title || 'Test', body || 'Direct test notification', type || 'test', {});
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const JOBS = {
    'overdue-tasks': runOverdueTaskAlerts,
    'goal-deadlines': runGoalDeadlineAlerts,
    'streak-risk': runHabitStreakRiskAlerts,
    'streak-milestones': runStreakMilestones,
    'journal-nudge': runJournalNudge,
    'weekly-digest': runWeeklyDigest,
  };

  router.post('/notifications/:jobName', requireAuth, async (req, res) => {
    const job = JOBS[req.params.jobName];
    if (!job) return res.status(400).json({ error: `Unknown job. Options: ${Object.keys(JOBS).join(', ')}` });
    try {
      await job();
      res.json({ success: true, ran: req.params.jobName });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createDevTestRouter };