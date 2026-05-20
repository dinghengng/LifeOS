"use client";

import { useState, useEffect } from 'react';
import NewTaskForm from "../components/NewTaskForm";
import TaskList from "../components/TaskList";
// our UI for adding and displaying tasks

export type Priority = "critical" | "high" | "low" | "none";
// Defining data structure of task (React or frontend version)
export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate: string | null; // allow empty deadline
  priority: Priority; // using defined type above
}


// Database/backend format
interface DBTask {
  id: number;
  title: string;
  is_completed: boolean;
  due_date: string | null; // allow empty deadline
  priority: Priority;
}

// sorting logic
const priorityRank: Record<Priority, number> = {
  critical: 1,
  high: 2,
  low: 3,
  none: 4,
};

// boolean to check if due date is present
const hasDueTime = (dueDate: string | null) => {
  if (!dueDate) return false;
  // For now, treat any non-null dueDate as “timed”
  return true;
};


export default function Page() {
  // Start with empty array 
  // Task objects will be stored in an array in React State.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);   // loading flag
  const [error, setError] = useState<string | null>(null); // error
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all"); // prio flag


  // run when pages load then fetch tasks from PostgreSQL when the page loads
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setError(null);            // clear any previous error
        setLoading(true);          // load

        // await new Promise((resolve) => setTimeout(resolve, 1500)); // artificial delay

        const response = await fetch('http://localhost:5001/tasks'); // test wrong path here

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks (status ${response.status})`);
        }

        const jsonData = await response.json();
        // map the data here cos SQL uses snake but react uses camelcase
        const formattedTasks = jsonData.map((task: DBTask) => ({
          id: task.id,
          title: task.title,
          isCompleted: task.is_completed,
          dueDate: task.due_date,
          priority: task.priority ?? "none", // default is none
        }));
        
        setTasks(formattedTasks); //save into react state
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error fetching tasks:", err.message);
          setError("Unable to load tasks. Please try again."); // show friendly message
        }
      } finally {
        setLoading(false);         // done loading
      }
    };

    fetchTasks();
  }, []); // Empty array = runs once on mount


  // Add a new task to PostgreSQL
  const addTask = async (titleString: string, dueDate: string | null, priority: Priority = "none") => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5001/tasks', { // test wrong path here
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleString, dueDate, priority, })
      });

      if (!response.ok) {
        throw new Error(`Failed to add task (status ${response.status})`);
      }
      
      // The backend gives us back the newly created row, complete with its real Database ID
      const newTaskDB: DBTask = await response.json();
      
      const newTask: Task = {
        id: newTaskDB.id, 
        title: newTaskDB.title,
        isCompleted: newTaskDB.is_completed,
        dueDate: newTaskDB.due_date,
        priority: newTaskDB.priority ?? "none",
      };

      setTasks([...tasks, newTask]); //adds new task to list
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error adding task:", err.message);
        setError("Could not add task. Please try again.");
      }
    }
  };


  // Update task completion status 
  const toggleTask = async (taskId: number) => {
    // Find the current status so we can flip it
    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;
    const newStatus = !taskToToggle.isCompleted;

    try {
      setError(null);
      const response = await fetch(`http://localhost:5001/tasks/${taskId}`, { // test wrong path here
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle task (status ${response.status})`);
      }

      // Update the React UI to show changes
      setTasks(tasks.map((task) => 
        task.id === taskId ? { ...task, isCompleted: newStatus } : task
      )); //only update that one
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error toggling task:", err.message);
        setError("Could not update task. Please try again.");
      }
    }
  };


  // Remove a task from PostgreSQL
  const deleteTask = async (idToDelete: number) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:5001/tasks/${idToDelete}`, { // test wrong path here
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task (status ${response.status})`);
      }

      // Remove it from the UI
      setTasks(tasks.filter((task) => task.id !== idToDelete));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error deleting task:", err.message);
        setError("Could not delete task. Please try again.");
      }
    }
  };

  // apply the priority filter
  const filteredTasks = tasks.filter((task) => {
  if (priorityFilter === "all") return true;
  return task.priority === priorityFilter;
  });

  // nested sort: timed tasks first, then by priority
  const visibleTasks = [...filteredTasks].sort((a, b) => {
  const aHasTime = hasDueTime(a.dueDate);
  const bHasTime = hasDueTime(b.dueDate);

  if (aHasTime && !bHasTime) return -1;
  if (!aHasTime && bHasTime) return 1;

  const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  if (a.dueDate && b.dueDate) {
    return (
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  // default to task created first in the list
  return a.id - b.id;
  });


  return (
    <main className="min-h-screen bg-slate-100 flex justify-center py-10 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-3xl">
        
        <h1 className="text-3xl font-bold text-slate-800 mb-4 text-center">
          LifeOS Tasks
        </h1>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-slate-500 text-center mt-4">Loading tasks...</p>
        ) : (
          <>
            <NewTaskForm onAddTask={addTask} />

            {/* Priority filter buttons */}
            <div className="flex gap-2 mb-4 flex-wrap justify-center">
              {["all", "critical", "high", "low", "none"].map((level) => (
    <button
      key={level}
      onClick={() => setPriorityFilter(level as Priority | "all")}
      className={`px-3 py-1.5 rounded-full text-sm border ${
        priorityFilter === level
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-300"
      }`}
    >
      {level === "all"
        ? "All"
        : level.charAt(0).toUpperCase() + level.slice(1)}
    </button>
  ))}
            </div>

            <TaskList 
              tasks={visibleTasks} 
              onToggleTask={toggleTask} 
              onDeleteTask={deleteTask} 
            />
          </>
        )}
      </div>
    </main>
  );
}