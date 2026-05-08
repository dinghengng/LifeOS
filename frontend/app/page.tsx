"use client";

import { useState, useEffect } from 'react';
import NewTaskForm from "./NewTaskForm";
import TaskList from "./TaskList";

// Defining data structure of task
export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
}

export default function Page() {
  // Start with empty array (server and client both see this initially)
  // Task objects will be stored in an array in React State.
  const [tasks, setTasks] = useState<Task[]>([]);

  // LOCALSTORAGE STEP 1: Load tasks from browser storage AFTER first render
  // This runs only once when the component mounts (empty [] dependency)
  // By loading AFTER hydration, we avoid server/client mismatch
  useEffect(() => {
    const savedTasks = localStorage.getItem('lifeos-tasks');
    if (savedTasks) {
      // If we found saved tasks, parse the JSON string back into an array
      setTasks(JSON.parse(savedTasks));
    }
  }, []); // Empty array = run once on mount, never again

  // LOCALSTORAGE STEP 2: Automatically save to browser storage whenever tasks change
  // useEffect runs AFTER the component renders
  // The [tasks] dependency means: "run this effect whenever the tasks array changes"
  useEffect(() => {
    // Convert our tasks array to a JSON string and save it
    // This happens automatically after every add, delete, or toggle!
    localStorage.setItem('lifeos-tasks', JSON.stringify(tasks));
  }, [tasks]); // Watch the tasks array - save whenever it changes

  // #1: ADDING TASKS
  const addTask = (titleString: string) => {
    const newTask: Task = {
      id: Date.now(), // Unique ID
      title: titleString,
      isCompleted: false,
    };
    setTasks([...tasks, newTask]);
  };

  // #2: TOGGLING TASKS (Check/Uncheck)
  const toggleTask = (taskId: number) => {
    setTasks(tasks.map((task) => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    ));
  };

  // #3: DELETING TASKS
  // Instead of index, we use the unique ID to find the task to remove
  const deleteTask = (idToDelete: number) => {
    // .filter keeps everything that DOES NOT match the ID we want to kill
    setTasks(tasks.filter((task) => task.id !== idToDelete));
  };

  // 3. THE BODY: One single return statement for the whole UI
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-10">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        
        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">
          LifeOS Tasks
        </h1>

        {/* Handing the 'Add' wire to the form */}
        <NewTaskForm onAddTask={addTask} />

        {/* Handing THREE things to the list:
          1. The data (tasks)
          2. The toggle wire (onToggleTask)
          3. The delete wire (onDeleteTask)
        */}
        <TaskList 
          tasks={tasks} 
          onToggleTask={toggleTask} 
          onDeleteTask={deleteTask} 
        />

      </div>
    </main>
  );
}