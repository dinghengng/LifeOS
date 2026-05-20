// 1. We MUST put this at the very top of interactive Next.js components!
// It tells Next.js: "Hey, this file needs to run in the user's browser, not just on the server."
// “This component must run in the browser (client side), not only on the server.”
"use client"; 

import { useState, SyntheticEvent } from "react"; // In short, useState allows a React component to: remember data, change data when users interact, automatically update the UI when the data changes

type Priority = "critical" | "high" | "low" | "none";
// 1. Tell TypeScript we expect a function called 'onAddTask'
interface NewTaskFormProps {
  onAddTask: (task: string, dueDate: string | null, priority: Priority) => void;
}

export default function NewTaskForm({ onAddTask }: NewTaskFormProps) {
  // 2. This is React State! 
  // 'taskTitle' is the current text. 
  // 'setTaskTitle' is the function we use to update it.
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(""); // due date state
  const [taskDueTime, setTaskDueTime] = useState(""); // due time state
  const [taskPriority, setTaskPriority] = useState<Priority>("none"); // priority state

  // 3. This function runs when the user clicks "Add" or hits Enter
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents the browser from refreshing the page
    
    if (taskTitle.trim() === "") return; // Don't add empty tasks

    let combinedDueDate: string | null = null;

    if (taskDueDate || taskDueTime) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

      // If no date picked, use today.
      const dateStr = taskDueDate || todayStr;
      const [year, month, day] = dateStr.split("-").map(Number);

      // If no time picked, use 23:59.
      const timeStr = taskDueTime || "23:59";
      const [hour, minute] = timeStr.split(":").map(Number);

      // Build a LOCAL date, not a UTC string.
      const localDate = new Date(year, month - 1, day, hour, minute);

      // validation to ensure deadline is in the future
      if (localDate.getTime() <= now.getTime()) {
        alert("Deadline must be in the future.");
        return;
      }

      combinedDueDate = localDate.toISOString();
    }

    //we trigger the wire and send the text!
    onAddTask(taskTitle, combinedDueDate, taskPriority);

    // Clear the input box after adding
    setTaskTitle("");
    setTaskDueDate("");
    setTaskDueTime("");
    setTaskPriority("none");
  };

  return (
    // 4. We use a <form> tag so the user can press the 'Enter' key to submit
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <div className="flex gap-2">
        <input 
        type="text" 
        placeholder="What needs to be done?" 
        // 5. We connect the input box directly to our React State memory
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        className="border border-slate-300 rounded-lg p-2 w-full focus:outline-none focus:border-indigo-500"
        />
        <button 
          type="submit" 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={taskPriority}
          onChange={(e) => setTaskPriority(e.target.value as Priority)}
          className="border rounded px-3 py-2"
        >
          <option value="none">None</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
        <label className="text-sm text-slate-600">
          Deadline:
        </label>
        <input
          type="date"
          value={taskDueDate}
          onChange={(e) => setTaskDueDate(e.target.value)}
          className="border border-slate-300 rounded-lg p-1 text-sm focus:outline-none focus:border-indigo-500"
        />
        <input
          type="time"
          value={taskDueTime}
          onChange={(e) => setTaskDueTime(e.target.value)}
          className="border border-slate-300 rounded-lg p-1 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
    </form>
  );
}