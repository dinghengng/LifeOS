"use client"

import { useState } from 'react';
import NewTaskForm from "./NewTaskForm";
import TaskList from './taskList';


//creates the function
export default function Page() {
  const addTask = (newTaskString: string) => {
  setTasks([...tasks, newTaskString]);
};
  const [tasks, setTasks] = useState(["Test task 1", "Test task 2"]);
  
  return (
    <div>
      <h1>LifeOS - To-Do List</h1>
       <NewTaskForm onAddTask={addTask} /> 
      <TaskList tasks={tasks} />
    </div>
  )//We pass the 'addTask' function down to NewTaskForm as a prop called 'onAddTask'
}





