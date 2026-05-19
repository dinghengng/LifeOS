"use client";

import { useState, useEffect } from 'react';
import NewTaskForm from "../components/NewTaskForm";
import TaskList from "../components/TaskList";
// our UI for adding and displaying tasks

// Defining data structure of task (React or frontend version)
export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
}

// Database/backend format
interface DBTask {
  id: number;
  title: string;
  is_completed: boolean;
}

export default function Page() {
  // Start with empty array 
  // Task objects will be stored in an array in React State.
  const [tasks, setTasks] = useState<Task[]>([]);
  // run when pages load then fetch tasks from PostgreSQL when the page loads
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:5001/tasks');
        const jsonData = await response.json();
        // map the data here cos SQL uses snake but react uses camelcase
        const formattedTasks = jsonData.map((task: DBTask) => ({
          id: task.id,
          title: task.title,
          isCompleted: task.is_completed
        }));
        
        setTasks(formattedTasks); //save into react state
      } catch (err: unknown) {
          if (err instanceof Error) {
            console.error("Error fetching tasks:", err.message);
          }
        }
    };

    fetchTasks();
  }, []); // Empty array = runs once on mount

  // Add a new task to PostgreSQL
  const addTask = async (titleString: string) => {
    try {
      const response = await fetch('http://localhost:5001/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleString })
      });
      
      // The backend gives us back the newly created row, complete with its real Database ID
      const newTaskDB = await response.json();
      
      const newTask: Task = {
        id: newTaskDB.id, 
        title: newTaskDB.title,
        isCompleted: newTaskDB.is_completed,
      };

      setTasks([...tasks, newTask]); //adds new task to list
    } catch (err: unknown) {
  if (err instanceof Error) {
      console.error("Error adding task:", err.message);
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
      await fetch(`http://localhost:5001/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newStatus })
      });
      // Update the React UI to show changes
      setTasks(tasks.map((task) => 
        task.id === taskId ? { ...task, isCompleted: newStatus } : task
      )); //only update that one
    } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error toggling task:", err.message);
    }
  }
  };

  // Remove a task from PostgreSQL
  const deleteTask = async (idToDelete: number) => {
    try {
      await fetch(`http://localhost:5001/tasks/${idToDelete}`, {
        method: 'DELETE'
      });
      // Remove it from the UI
      setTasks(tasks.filter((task) => task.id !== idToDelete));
    } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("Error deleting task:", err.message);
  }
}
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-10">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        
        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">
          LifeOS Tasks
        </h1>

        <NewTaskForm onAddTask={addTask} />

        <TaskList 
          tasks={tasks} 
          onToggleTask={toggleTask} 
          onDeleteTask={deleteTask} 
        />
      </div>
    </main>
  );
}