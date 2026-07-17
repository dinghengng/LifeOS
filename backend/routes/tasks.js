const express = require("express");
const pool = require("../db");

function createTasksRouter(requireAuth) {
  const router = express.Router();

  // RETRIEVE ALL TASKS (GET REQUEST)
  router.get("/", requireAuth, async (req, res) => {
    try {
      const allTasks = await pool.query(
        "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC",
        [req.user.id],
      );
      res.json(allTasks.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // CREATE A NEW TASK (POST REQUEST)
  router.post("/", requireAuth, async (req, res) => {
    try {
      const { title, dueDate, priority } = req.body;
      const safePriority = ["critical", "high", "low", "none"].includes(
        priority,
      )
        ? priority
        : "none";

      const newTask = await pool.query(
        "INSERT INTO tasks (title, due_date, priority, user_id) VALUES($1, $2, $3, $4) RETURNING *",
        [title, dueDate || null, safePriority, req.user.id],
      );
      res.status(201).json(newTask.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // UPDATE TASK STATUS (PUT REQUEST)
  router.put("/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { isCompleted } = req.body;

      const updateTask = await pool.query(
        "UPDATE tasks SET is_completed = $1, completed_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END WHERE id = $2 AND user_id = $3 RETURNING *",
        [isCompleted, id, req.user.id],
      );

      if (updateTask.rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(updateTask.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // EDIT TASK DETAILS (PATCH REQUEST)
  router.patch("/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, dueDate, priority } = req.body;

      const safePriority = ["critical", "high", "low", "none"].includes(
        priority,
      )
        ? priority
        : "none";

      const updateTask = await pool.query(
        `
      UPDATE tasks
      SET 
        title = COALESCE($1, title),
        due_date = COALESCE($2, due_date),
        priority = COALESCE($3, priority)
      WHERE id = $4 AND user_id = $5
      RETURNING *
      `,
        [title ?? null, dueDate ?? null, safePriority, id, req.user.id],
      );

      if (updateTask.rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(updateTask.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  // PERMANENTLY ERASE A TASK (DELETE REQUEST)
  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, req.user.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ message: "Task was successfully deleted!" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}

module.exports = { createTasksRouter };