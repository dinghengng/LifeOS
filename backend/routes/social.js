const express = require("express");
const pool = require("../db");

function createSocialRouter(requireAuth) {
  const router = express.Router();

  // Search users by username
  router.get("/users", requireAuth, async (req, res) => {
    const query = (req.query.query || "").trim();
    if (!query) return res.json([]);

    try {
      const result = await pool.query(
        `SELECT id, name, username
         FROM users
         WHERE username ILIKE $1
           AND id != $2
           AND username IS NOT NULL
         ORDER BY username ASC
         LIMIT 20`,
        [`%${query}%`, req.user.id],
      );
      res.json(result.rows);
    } catch (err) {
      console.error("User search error:", err.message);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Profile lookup
  router.get("/profiles/:userId", requireAuth, async (req, res) => {
    const { userId } = req.params;
    if (!/^\d+$/.test(userId)) {
      return res.status(404).json({ error: "Profile not found" });
    }

    try {
      const result = await pool.query(
        `SELECT id, name, username FROM users WHERE id = $1 AND username IS NOT NULL`,
        [userId],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Profile fetch error:", err.message);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // get shared completion posts
  router.get("/profiles/:userId/posts", requireAuth, async (req, res) => {
    const { userId } = req.params;
    if (!/^\d+$/.test(userId)) {
      return res.status(404).json({ error: "Profile not found" });
    }

    try {
      const userCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND username IS NOT NULL`,
        [userId],
      );
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const result = await pool.query(
        `SELECT cp.id, cp.challenge_id, cp.tier, cp.period_start, cp.period_end, cp.created_at,
                COUNT(ck.id) AS kudos_count
         FROM challenge_posts cp
         LEFT JOIN challenge_kudos ck ON ck.post_id = cp.id
         WHERE cp.user_id = $1
         GROUP BY cp.id
         ORDER BY cp.created_at DESC
         LIMIT 50`,
        [userId],
      );
      res.json(
        result.rows.map((r) => ({
          id: r.id,
          challengeId: r.challenge_id,
          tier: r.tier,
          periodStart: r.period_start,
          periodEnd: r.period_end,
          createdAt: r.created_at,
          kudosCount: parseInt(r.kudos_count, 10),
        })),
      );
    } catch (err) {
      console.error("Profile posts fetch error:", err.message);
      res.status(500).json({ error: "Failed to fetch profile posts" });
    }
  });

  return router;
}

module.exports = { createSocialRouter };