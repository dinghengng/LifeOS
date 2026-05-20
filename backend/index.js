//Importing all the tools we need for our server 
const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
require('dotenv').config();


// Instantiating our application instance by calling the express function
const app = express();
//Setting our deployment port to check our .env file first, otherwise default to local port 5000
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json()); 


// RETRIEVE ALL TASKS (GET REQUEST)
// Triggers when the client accesses http://localhost:5000/tasks
app.get('/tasks', async (req, res) => {
  try {
    const allTasks = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    // Hand back the raw array of table row data to the frontend in standard JSON format
    res.json(allTasks.rows);
  } catch (err) {
    // Print out any unexpected errors 
    console.error(err.message);
    // Alert the frontend application that an internal database connection breakdown occurred
    res.status(500).send("Server Error");
  }
});

// CREATE A NEW TASK (POST REQUEST)
// Triggers when the client pushes new entry details to local host for tasks 
app.post('/tasks', async (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;
    const safePriority = ["critical", "high", "low", "none"].includes(priority) ? priority : "none";
    // insert the dynamic title variable into our database 
    const newTask = await pool.query(
      "INSERT INTO tasks (title, due_date, priority) VALUES($1, $2, $3) RETURNING *",
      [title, dueDate || null, safePriority] // allow empty deadlines
    );
    // Return the newly spawned table row record directly back to our active client interface
    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    // Handle failures gracefully by outputting error details and returning server error code 500
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// UPDATE TASK STATUS (PUT REQUEST)
// Triggers when the client toggles completion at http://localhost:5000/tasks/:id
app.put('/tasks/:id', async (req, res) => {
  try {
    // Extract the variable route parameter target string (:id) out from the request URL path context
    const { id } = req.params;
    
    // Extract the updated boolean completion property sent inside our request payload body
    const { isCompleted } = req.body;
    
    // Execute a SQL transaction mapping our parameters to safely modify task status based on ID matching
    const updateTask = await pool.query(
      "UPDATE tasks SET is_completed = $1 WHERE id = $2 RETURNING *",
      [isCompleted, id]
    );
    
    // Pass back the freshly modified task row structure data to confirm structural storage changes
    res.json(updateTask.rows[0]);
  } catch (err) {
    // Handle exceptions by logging terminal details and issuing a standard 500 network response
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PERMANENTLY ERASE A TASK (DELETE REQUEST)
// Triggers when the client strikes out a line item using http://localhost:5000/tasks/:id
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    res.json({ message: "Task was successfully deleted!" });
  } catch (err) {
    // Catch database error 
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// Binding our active server application instance to listen directly on our designated system port
app.listen(PORT, () => {
  // Print verification text out to our development environment terminal when ignition finishes smoothly
  console.log(`Server is running on port ${PORT}`);
});