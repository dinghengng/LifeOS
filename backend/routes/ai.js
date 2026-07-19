const express = require("express");
const pool = require("../db");

function createInsightsRouter(requireAuth) {
  const router = express.Router();

  // GET the latest weekly digest for the current user
  router.get("/", requireAuth, async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const { rows } = await pool.query(
        `SELECT id, type, payload, narration, week_start, generated_at
         FROM ai_insights
         WHERE user_id = $1
         ORDER BY generated_at DESC
         LIMIT 1`,
        [req.user.id],
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error("Insights fetch error:", err.message);
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  // GET recent digest history 
  router.get("/history", requireAuth, async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const { rows } = await pool.query(
        `SELECT id, payload, narration, week_start, generated_at
         FROM ai_insights
         WHERE user_id = $1
         ORDER BY week_start DESC
         LIMIT 12`,
        [req.user.id],
      );
      res.json(rows);
    } catch (err) {
      console.error("Insights history fetch error:", err.message);
      res.status(500).json({ error: "Failed to fetch insights history" });
    }
  });

  return router;
}

module.exports = { createInsightsRouter };