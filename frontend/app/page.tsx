"use client"

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
}





