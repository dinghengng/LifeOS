"use client";

import { useState } from 'react';
import NewTaskForm from "../components/NewTaskForm";
import TaskList from "../components/TaskList";

// Defining data structure of task
export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
}

export default function Page() {
  //task objects will be stored in an array in React State. We start with an empty array.
  const [tasks, setTasks] = useState<Task[]>([]);
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