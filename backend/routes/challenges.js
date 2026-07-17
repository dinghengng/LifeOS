const express = require("express");
const pool = require("../db");
const { CHALLENGES } = require("../config/challenges");
const { getPeriodBounds } = require("../utils/period");

function computeTierProgress(count, tiers) {
  let tier = null;
  if (count >= tiers.gold) tier = "gold";
  else if (count >= tiers.silver) tier = "silver";
  else if (count >= tiers.bronze) tier = "bronze";

  let nextTier = null;
  let remainingToNext = null;
  if (tier === null) {
    nextTier = "bronze";
    remainingToNext = tiers.bronze - count;
  } else if (tier === "bronze") {
    nextTier = "silver";
    remainingToNext = tiers.silver - count;
  } else if (tier === "silver") {
    nextTier = "gold";
    remainingToNext = tiers.gold - count;
  }

  return { tier, nextTier, remainingToNext };
}

async function getCountForChallenge(challenge, userId, start, end) {
  if (challenge.id === "task_sprint") {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM tasks
       WHERE user_id = $1
         AND is_completed = true
         AND completed_at >= $2
         AND completed_at < $3`,
      [userId, start, end],
    );
    return parseInt(result.rows[0].count, 10);
  }

  if (challengeId === "habit_rhythm") {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM habit_logs hl
       JOIN habits h ON h.id = hl.habit_id
       WHERE h.user_id = $1
         AND hl.status = 'done'
         AND hl.completed_at >= $2::date
         AND hl.completed_at < $3::date`,
      [userId, bounds.startDateStr, bounds.endDateStr],
    );
    return parseInt(result.rows[0].count, 10);
  }

  if (challengeId === "reflect_reset") {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM journal_entries
       WHERE user_id = $1
         AND created_at >= $2
         AND created_at < $3`,
      [userId, bounds.startInstant, bounds.endInstant],
    );
    return parseInt(result.rows[0].count, 10);
  }

  if (challengeId === "mood_checkin") {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM mood_logs
       WHERE user_id = $1
         AND logged_at >= $2
         AND logged_at < $3`,
      [userId, bounds.startInstant, bounds.endInstant],
    );
    return parseInt(result.rows[0].count, 10);
  }

  if (challengeId === "fuel_your_week") {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM meal_logs
       WHERE user_id = $1
         AND created_at >= $2
         AND created_at < $3`,
      [userId, bounds.startInstant, bounds.endInstant],
    );
    return parseInt(result.rows[0].count, 10);
  }

  return 0;
}

function createChallengesRouter(requireAuth) {
  const router = express.Router();

  router.get("/catalogue", requireAuth, (req, res) => {
    res.json(CHALLENGES);
  });

  router.get("/", requireAuth, async (req, res) => {
    try {
      const results = await Promise.all(
        CHALLENGES.map(async (challenge) => {
          const { start, end } = getPeriodBounds(challenge.period);
          const count = await getCountForChallenge(challenge, req.user.id, start, end);
          const { tier, nextTier, remainingToNext } = computeTierProgress(count, challenge.tiers);

          return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            period: challenge.period,
            tiers: challenge.tiers,
            count,
            tier,
            nextTier,
            remainingToNext,
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
            implemented: challenge.id === "task_sprint",
          };
        }),
      );

      res.json(results);
    } catch (err) {
      console.error("Fetch challenges error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}

module.exports = { createChallengesRouter };