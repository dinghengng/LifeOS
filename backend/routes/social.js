const express = require("express");
const pool = require("../db");
const { getChallengeById } = require("../config/challenges");

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
  router.get("/profiles/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT id, name, username FROM users WHERE id = $1 AND username IS NOT NULL`,
        [id],
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
  router.get("/profiles/:id/posts", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      const userCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND username IS NOT NULL`,
        [id],
      );
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: "Profile not found" });
      }
      const userId = userCheck.rows[0].id;

      const result = await pool.query(
        `SELECT cp.id, cp.challenge_id, cp.tier, cp.period_start, cp.period_end, cp.created_at,
                COUNT(ck.id) AS kudos_count,
                EXISTS (
                SELECT 1 FROM challenge_kudos ck2
                WHERE ck2.post_id = cp.id AND ck2.user_id = $2
              ) AS has_kudosed
         FROM challenge_posts cp
         LEFT JOIN challenge_kudos ck ON ck.post_id = cp.id
         WHERE cp.user_id = $1
         GROUP BY cp.id
         ORDER BY cp.created_at DESC
         LIMIT 50`,
        [userId, req.user.id],
      );
      res.json(
        result.rows.map((r) => {
          const challenge = getChallengeById(r.challenge_id);
          return {
            id: r.id,
            challengeId: r.challenge_id,
            challengeTitle: challenge?.title ?? r.challenge_id, // NEW
            tier: r.tier,
            periodStart: r.period_start,
            periodEnd: r.period_end,
            createdAt: r.created_at,
            kudosCount: parseInt(r.kudos_count, 10),
            hasKudosed: r.has_kudosed,
          };
        }),
      );
    } catch (err) {
      console.error("Profile posts fetch error:", err.message);
      res.status(500).json({ error: "Failed to fetch profile posts" });
    }
  });

  // post completion post
  router.post("/posts", requireAuth, async (req, res) => {
    const { challengeId, tier, periodStart, periodEnd } = req.body;

    if (!challengeId || !tier || !periodStart || !periodEnd) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["bronze", "silver", "gold"].includes(tier)) {
        return res.status(400).json({ error: "Invalid tier" });
    }

    try {
        const result = await pool.query(
        `INSERT INTO challenge_posts (user_id, challenge_id, tier, period_start, period_end)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, challenge_id, tier, period_start, period_end, created_at`,
        [req.user.id, challengeId, tier, periodStart, periodEnd],
        );
        const r = result.rows[0];
        res.status(201).json({
        id: r.id,
        challengeId: r.challenge_id,
        tier: r.tier,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        createdAt: r.created_at,
        kudosCount: 0,
        });
    } catch (err) {
        if (err.code === "23505") {
        return res.status(409).json({ error: "Already shared this tier for this period" });
        }
        console.error("Create post error:", err.message);
        res.status(500).json({ error: "Failed to share achievement" });
    }
  });

  // encouragement kudos
  router.post("/posts/:postId/kudos", requireAuth, async (req, res) => {
    const { postId } = req.params;
    try {
      const postResult = await pool.query(
        `SELECT id, user_id FROM challenge_posts WHERE id = $1`,
        [postId],
      );
      if (postResult.rows.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }
      const post = postResult.rows[0];

      if (post.user_id === req.user.id) {
        return res.status(403).json({ error: "You cannot kudos your own post" });
      }

      const existing = await pool.query(
        `SELECT id FROM challenge_kudos WHERE post_id = $1 AND user_id = $2`,
        [postId, req.user.id],
      );

      let hasKudosed;
      if (existing.rows.length > 0) {
        await pool.query(`DELETE FROM challenge_kudos WHERE id = $1`, [existing.rows[0].id]);
        hasKudosed = false;
      } else {
        try {
          await pool.query(
            `INSERT INTO challenge_kudos (post_id, user_id) VALUES ($1, $2)`,
            [postId, req.user.id],
          );
          hasKudosed = true;
        } catch (err) {
          if (err.code === "23505") {
            hasKudosed = true; 
          } else {
            throw err;
          }
        }
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) AS count FROM challenge_kudos WHERE post_id = $1`,
        [postId],
      );

      res.json({
        kudosCount: parseInt(countResult.rows[0].count, 10),
        hasKudosed,
      });
    } catch (err) {
      console.error("Kudos toggle error:", err.message);
      res.status(500).json({ error: "Failed to toggle kudos" });
    }
  });

  return router;
}

module.exports = { createSocialRouter };