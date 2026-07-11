const express = require("express");
const pool = require("../db");

function createMoodRouter(requireAuth) {
  const router = express.Router();

  // Get mood tags
  // returns tags + user created tags
  router.get("/tags", requireAuth, async (req, res) => {
    try {
      const systemTags = await pool.query(
        "SELECT id, name, 'system' AS type FROM tags ORDER BY name ASC",
      );
      const userTags = await pool.query(
        "SELECT id, name, 'custom' AS type FROM user_tags WHERE user_id = $1 ORDER BY name ASC",
        [req.user.id],
      );
      res.json({ system: systemTags.rows, custom: userTags.rows });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // Creates a custom "Other" tag
  router.post("/tags/custom", requireAuth, async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO user_tags (user_id, name)
       VALUES ($1, $2)
       ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, 'custom' AS type`,
        [req.user.id, name.trim().toLowerCase()],
      ); //return exisiting tag if name already in use

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // DELETE a custom tag
  router.delete("/tags/custom/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const existing = await pool.query(
        "SELECT id FROM user_tags WHERE id = $1 AND user_id = $2",
        [id, req.user.id],
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Custom tag not found" });
      }

      await pool.query("DELETE FROM mood_log_tags WHERE user_tag_id = $1", [
        id,
      ]);

      await pool.query("DELETE FROM user_tags WHERE id = $1 AND user_id = $2", [
        id,
        req.user.id,
      ]);

      res.json({ success: true });
    } catch (err) {
      console.error("Delete custom tag error:", err.message);
      res.status(500).json({ error: "Failed to delete custom tag" });
    }
  });

  // Create mood log
  // create mood entry with stress level and tags
  router.post("/logs", requireAuth, async (req, res) => {
    const {
      mood_level,
      stress_level,
      systemTagIds = [],
      customTagIds = [],
      loggedAt,
      note,
    } = req.body;

    if (!mood_level || !stress_level) {
      return res
        .status(400)
        .json({ error: "mood_level and stress_level are required" });
    }

    try {
      const logResult = await pool.query(
        `INSERT INTO mood_logs (user_id, mood_level, stress_level, logged_at, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
        [
          req.user.id,
          mood_level,
          stress_level,
          loggedAt || new Date().toISOString(),
          note || null,
        ],
      );
      const newLog = logResult.rows[0];

      for (const tagId of systemTagIds) {
        await pool.query(
          "INSERT INTO mood_log_tags (mood_log_id, tag_id) VALUES ($1, $2)",
          [newLog.id, tagId],
        );
      }
      for (const userTagId of customTagIds) {
        await pool.query(
          "INSERT INTO mood_log_tags (mood_log_id, user_tag_id) VALUES ($1, $2)",
          [newLog.id, userTagId],
        );
      }

      res.status(201).json({ ...newLog, tags: [] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  router.get("/logs", requireAuth, async (req, res) => {
    try {
      const logsResult = await pool.query(
        `SELECT id, mood_level, stress_level, logged_at, created_at, note
       FROM mood_logs
       WHERE user_id = $1
       ORDER BY logged_at DESC`,
        [req.user.id],
      );

      if (logsResult.rows.length === 0) return res.json([]);

      const logIds = logsResult.rows.map((r) => r.id);
      const tagsResult = await pool.query(
        `SELECT
         mlt.mood_log_id,
         COALESCE(t.id, ut.id)     AS tag_id,
         COALESCE(t.name, ut.name) AS tag_name,
         CASE WHEN t.id IS NOT NULL THEN 'system' ELSE 'custom' END AS tag_type
       FROM mood_log_tags mlt
       LEFT JOIN tags t       ON mlt.tag_id = t.id
       LEFT JOIN user_tags ut ON mlt.user_tag_id = ut.id
       WHERE mlt.mood_log_id = ANY($1)`,
        [logIds],
      );

      const tagsByLog = {};
      for (const tag of tagsResult.rows) {
        if (!tagsByLog[tag.mood_log_id]) tagsByLog[tag.mood_log_id] = [];
        tagsByLog[tag.mood_log_id].push({
          id: tag.tag_id,
          name: tag.tag_name,
          type: tag.tag_type,
        });
      }

      const logs = logsResult.rows.map((log) => ({
        ...log,
        tags: tagsByLog[log.id] || [],
      }));
      res.json(logs);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // Edit mood log
  // Updates mood level, stress level, tags, backfilled time
  router.patch("/logs/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const {
      mood_level,
      stress_level,
      systemTagIds,
      customTagIds,
      loggedAt,
      note,
    } = req.body;

    try {
      const existing = await pool.query(
        "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
        [id, req.user.id],
      );
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Mood log not found" });
      }

      // Only update what was sent
      const updated = await pool.query(
        `UPDATE mood_logs
       SET
         mood_level   = COALESCE($1, mood_level),
         stress_level = COALESCE($2, stress_level),
         logged_at    = COALESCE($3, logged_at),
         note         = COALESCE($4, note)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
        [
          mood_level ?? null,
          stress_level ?? null,
          loggedAt ?? null,
          note ?? null,
          id,
          req.user.id,
        ],
      );

      // Replace tags only if a new tag list was provided
      if (systemTagIds !== undefined || customTagIds !== undefined) {
        await pool.query("DELETE FROM mood_log_tags WHERE mood_log_id = $1", [
          id,
        ]);

        for (const tagId of systemTagIds || []) {
          await pool.query(
            "INSERT INTO mood_log_tags (mood_log_id, tag_id) VALUES ($1, $2)",
            [id, tagId],
          );
        }
        for (const userTagId of customTagIds || []) {
          await pool.query(
            "INSERT INTO mood_log_tags (mood_log_id, user_tag_id) VALUES ($1, $2)",
            [id, userTagId],
          );
        }
      }

      res.json(updated.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // Delete mood log
  // Sets mood log to null
  router.delete("/logs/:id", requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      await client.query("BEGIN");
      //delete the journal entry first
      await client.query(
        "DELETE FROM journal_entries WHERE mood_log_id = $1 AND user_id = $2",
        [id, req.user.id],
      );
      const result = await client.query(
        "DELETE FROM mood_logs WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, req.user.id],
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Mood log not found" });
      }

      await client.query("COMMIT");
      res.json({ message: "Mood log deleted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err.message);
      res.status(500).send("Server Error");
    } finally {
      client.release();
    }
  });

  // GET: mood packs
  router.get("/emoji-packs", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, emojis, is_default FROM emoji_packs ORDER BY is_default DESC, id ASC",
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // GET: user chosen mood pack
  router.get("/config", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, level, label, emoji, color, display_order
       FROM mood_levels
       WHERE user_id = $1
       ORDER BY display_order ASC`,
        [req.user.id],
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // PUT: all the mood packs to choose from
  router.put("/config", requireAuth, async (req, res) => {
    const { levels } = req.body;

    if (!Array.isArray(levels) || levels.length !== 5) {
      return res.status(400).json({ error: "Exactly 5 mood levels required" });
    }

    for (const l of levels) {
      if (
        ![1, 2, 3, 4, 5].includes(l.level) ||
        !l.label ||
        !l.emoji ||
        !l.color
      ) {
        return res.status(400).json({ error: "Invalid mood level data" });
      }
    }

    try {
      const saved = [];
      for (const l of levels) {
        const result = await pool.query(
          `INSERT INTO mood_levels (user_id, level, label, emoji, color, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, level)
         DO UPDATE SET
           label         = EXCLUDED.label,
           emoji         = EXCLUDED.emoji,
           color         = EXCLUDED.color,
           display_order = EXCLUDED.display_order
         RETURNING id, level, label, emoji, color, display_order`,
          [
            req.user.id,
            l.level,
            l.label,
            l.emoji,
            l.color,
            l.display_order ?? l.level - 1,
          ],
        );
        saved.push(result.rows[0]);
      }
      saved.sort((a, b) => a.display_order - b.display_order);
      res.json(saved);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}

// Mounted at "/journal" from index.js
function createJournalRouter(requireAuth) {
  const router = express.Router();

  // Get journal entries
  router.get("/", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
         je.id,
         je.mood_log_id,
         je.content,
         je.prompt_used,
         je.title,
         je.created_at,
         je.updated_at,
         ml.mood_level,
         ml.stress_level,
         ml.logged_at AS mood_logged_at
       FROM journal_entries je
       LEFT JOIN mood_logs ml ON je.mood_log_id = ml.id
       WHERE je.user_id = $1
       ORDER BY je.created_at DESC`,
        [req.user.id],
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // Create journal entry
  router.post("/", requireAuth, async (req, res) => {
    const { content, mood_log_id, prompt_used, title } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      if (mood_log_id) {
        const check = await client.query(
          "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
          [mood_log_id, req.user.id],
        );
        if (check.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(403).json({ error: "Invalid mood log reference" });
        }
        //journal entry replaces note
        await client.query(
          "UPDATE mood_logs SET note = NULL WHERE id = $1 AND user_id = $2",
          [mood_log_id, req.user.id],
        );
      }

      const result = await client.query(
        `INSERT INTO journal_entries (user_id, mood_log_id, content, prompt_used, title)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
        [
          req.user.id,
          mood_log_id || null,
          content,
          prompt_used || null,
          title || null,
        ],
      );

      await client.query("COMMIT");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err.message);
      res.status(500).send("Server Error");
    } finally {
      client.release();
    }
  });

  // Edit journal entry
  router.patch("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { content, mood_log_id, title } = req.body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const existing = await client.query(
        "SELECT id FROM journal_entries WHERE id = $1 AND user_id = $2",
        [id, req.user.id],
      );
      if (existing.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Journal entry not found" });
      }

      if (mood_log_id !== undefined && mood_log_id !== null) {
        const check = await client.query(
          "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
          [mood_log_id, req.user.id],
        );
        if (check.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(403).json({ error: "Invalid mood log reference" });
        }
      }

      const result = await client.query(
        `UPDATE journal_entries
       SET
         content     = COALESCE($1, content),
         mood_log_id = CASE WHEN $2::int IS NOT NULL THEN $2::int ELSE mood_log_id END,
         title       = COALESCE($3, title),
         updated_at  = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
        [content ?? null, mood_log_id ?? null, title ?? null, id, req.user.id],
      );

      await client.query("COMMIT");
      res.json(result.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err.message);
      res.status(500).send("Server Error");
    } finally {
      client.release();
    }
  });

  // Delete journal entry
  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, req.user.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Journal entry not found" });
      }

      res.json({ message: "Journal entry deleted successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}

module.exports = { createMoodRouter, createJournalRouter };