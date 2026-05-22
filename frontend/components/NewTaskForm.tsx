// We MUST put this at the very top of interactive Next.js components!
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
  // taskTitle is the current text, then'setTaskTitle' is the function we use to update it.
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(""); // due date state
  const [taskDueTime, setTaskDueTime] = useState(""); // due time state
  const [taskPriority, setTaskPriority] = useState<Priority>("none"); // priority state

  // runs when the user clicks "Add" or hits Enter
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
  <form
    onSubmit={handleSubmit}
    className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
  >
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <input
        type="text"
        placeholder="What needs to be done?"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <select
        value={taskPriority}
        onChange={(e) => setTaskPriority(e.target.value as Priority)}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="none">Priority</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="low">Low</option>
      </select>

      <input
        type="date"
        value={taskDueDate}
        onChange={(e) => setTaskDueDate(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <input
        type="time"
        value={taskDueTime}
        onChange={(e) => setTaskDueTime(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        type="submit"
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Add Task
      </button>
    </div>
  </form>
);
}