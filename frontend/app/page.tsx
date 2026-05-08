"use client"

// 1. We MUST define the Object structure for our tasks somewhere that both the Page and TaskList can access.
export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
}

import { useState } from 'react';
import NewTaskForm from "./NewTaskForm";
import TaskList from './taskList';


//creates the function
export default function Page() {
  const [tasks, setTasks] = useState([]);
  const addTask = (newTaskString: string) => {
  setTasks([...tasks, newTaskString]);
};
  
  const deleteTask = (indexToDelete) => {
  // Use filter to create a new array WITHOUT the task at indexToDelete
  setTasks(tasks.filter((_, index) => index !== indexToDelete));
};
<TaskList tasks={tasks} onDeleteTask={deleteTask} />

  return (
    <div>
      <h1>LifeOS - To-Do List</h1>
       <NewTaskForm onAddTask={addTask} /> 
      <TaskList tasks={tasks} onDeleteTask={deleteTask}/>
    </div>
  )//We pass the 'addTask' function down to NewTaskForm as a prop called 'onAddTask'
  // We initialize our state with an empty array: []
  // We use <Task[]> to promise TypeScript that we will only ever put Task objects in here.
  const [tasks, setTasks] = useState<Task[]>([]);

  // #1: Adding tasks, We will hand this down to NewTaskForm
  const addTask = (titleString: string) => {
    
    // Create a brand new Task object
    const newTask: Task = {
      id: Date.now(), // Use the current timestamp as a perfectly unique ID
      title: titleString,
      isCompleted: false, // All new tasks start as incomplete
    };

    // Update the state: Keep all the old tasks (...tasks), and add the new one to the end
    setTasks([...tasks, newTask]);
  };
  
  // #2: For checking/unchecking tasks, will hand this down to TaskList
  const toggleTask = (taskId: number) => {
    
    // We loop through the array using .map()
    // If the task ID matches the one the user clicked, we flip its true/false switch
    // If it doesn't match, we leave it alone and return it exactly as is
    setTasks(tasks.map((task) => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    ));
  };


return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-10">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        
        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">
          LifeOS Tasks
        </h1>

        {/* The Form for (addTask) when user adds a new task. */}
        <NewTaskForm onAddTask={addTask} />

        {/* The List for (toggleTask) when user checks/unchecks a task. */}
        <TaskList tasks={tasks} onToggleTask={toggleTask} />

      </div>
    </main>
  );
}





