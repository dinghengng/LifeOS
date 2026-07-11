const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../db");

// Mounted at both "/auth" and "/api/user" from index.js (see createUserRouter usage)
function createAuthRouter(requireAuth) {
  const router = express.Router();

  // REGISTER A NEW USER ACCOUNT
  router.post("/register", async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    try {
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email.toLowerCase().trim()],
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already in use" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
        [email.toLowerCase().trim(), passwordHash, name || null],
      );
      const newUser = userResult.rows[0];

      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await pool.query(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
        [sessionId, newUser.id, expiresAt],
      );

      // Set cookie for web browsers
      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Mobile apps look inside the JSON response body payload directly for authentication parameters
      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        token: sessionId,
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // USER LOGIN
  router.post("/login", async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email.toLowerCase().trim(),
      ]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await pool.query(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
        [sessionId, user.id, expiresAt],
      );

      const cookieOptions = {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      };

      if (rememberMe) {
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      }

      res.cookie("sessionId", sessionId, cookieOptions);

      // Hand back token property configuration targets explicitly to authenticate your Expo phone environments
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        token: sessionId,
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // USER LOGOUT
  router.post("/logout", requireAuth, async (req, res) => {
    const sessionId = req.currentSessionId || req.cookies?.sessionId;

    try {
      await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);

      res.clearCookie("sessionId", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      res.json({ message: "Logged out" });
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET CURRENT LOGGED-IN USER
  router.get("/me", requireAuth, async (req, res) => {
    res.json({ id: req.user.id, email: req.user.email, name: req.user.name });
  });

  return router;
}

// Mounted at "/api/user" from index.js
function createUserProfileRouter(requireAuth) {
  const router = express.Router();

  // GET: FETCH USER BODY METRICS
  router.get("/metrics", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT weight_kg, height_cm, fitness_goal FROM users WHERE id = $1`,
        [req.user.id],
      );
      res.json(result.rows[0] || {});
    } catch (err) {
      console.error("Fetch metrics error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // POST: UPDATE USER BODY METRICS
  router.post("/metrics", requireAuth, async (req, res) => {
    const { weight_kg, height_cm, fitness_goal } = req.body;
    try {
      const result = await pool.query(
        `UPDATE users 
       SET weight_kg = $1, height_cm = $2, fitness_goal = $3 
       WHERE id = $4 
       RETURNING weight_kg, height_cm, fitness_goal`,
        [weight_kg, height_cm, fitness_goal, req.user.id],
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Update metrics error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // GET: FETCH USER XP
  router.get("/xp", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT total_xp, awarded_quest_ids FROM user_xp WHERE user_id = $1",
        [req.user.id],
      );
      res.json(result.rows[0] ?? { total_xp: 0, awarded_quest_ids: [] });
    } catch (err) {
      console.error("Fetch XP error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // POST: UPDATE USER XP
  router.post("/xp", requireAuth, async (req, res) => {
    const { total_xp, awarded_quest_ids } = req.body;
    if (total_xp === undefined || !awarded_quest_ids) {
      return res
        .status(400)
        .json({ error: "total_xp and awarded_quest_ids are required" });
    }
    try {
      const result = await pool.query(
        `INSERT INTO user_xp (user_id, total_xp, awarded_quest_ids)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET total_xp = $2, awarded_quest_ids = $3
       RETURNING *`,
        [req.user.id, total_xp, awarded_quest_ids],
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Update XP error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}

module.exports = { createAuthRouter, createUserProfileRouter };