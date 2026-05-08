"use client"

import { useState } from 'react';
import TaskList from './taskList';

export default function Page() {
  const [tasks, setTasks] = useState(["Test task 1", "Test task 2"]);
  
  return (
    <div>
      <h1>LifeOS - To-Do List</h1>
      <TaskList tasks={tasks} />
    </div>
  )
}


