const express = require('express');
const cors = require('cors');
const pool = require('./db'); // We will create this next
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows the server to read JSON from the frontend

// --- API ROUTES ---

// 1. Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const allTasks = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(allTasks.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// 2. Add a task
app.post('/tasks', async (req, res) => {
  try {
    const { title } = req.body;
    const newTask = await pool.query(
      "INSERT INTO tasks (title) VALUES($1) RETURNING *",
      [title]
    );
    res.json(newTask.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});