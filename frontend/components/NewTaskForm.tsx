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
  const [titleError, setTitleError] = useState<string | null>(null); // title error state
  const [deadlineError, setDeadlineError] = useState<string | null>(null); // deadline error state
const [isSubmitting, setIsSubmitting] = useState(false); // submitting state

  // function to ensure title length between 0 to 150
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value.slice(0, 150); // cap at 150
  setTaskTitle(value);

  if (titleError && value.trim().length > 0) {
    setTitleError(null);
  }
};

  // runs when the user clicks "Add" or hits Enter
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault(); // Prevents the browser from refreshing the page

  const trimmedTitle = taskTitle.trim();
  if (!trimmedTitle) {
    setTitleError("Title cannot be empty.");
    return;
  }

  setIsSubmitting(true);
  setTitleError(null);
  setDeadlineError(null);

  let combinedDueDate: string | null = null;
  const now = new Date();

  if (taskDueDate || taskDueTime) {
    const todayStr = now.toISOString().slice(0, 10);

    // If no date picked, use today.
    const dateStr = taskDueDate || todayStr;
    const [year, month, day] = dateStr.split("-").map(Number);

    // If no time picked, use 23:59.
    const timeStr = taskDueTime || "23:59";
    const [hour, minute] = timeStr.split(":").map(Number);

    const localDate = new Date(year, month - 1, day, hour, minute);

    // validation to ensure deadline is in the future
    if (localDate.getTime() <= now.getTime()) {
      setDeadlineError("Deadline must be in the future.");
      setIsSubmitting(false);
      return;
    }

    combinedDueDate = localDate.toISOString();
  }

  // send the text
  onAddTask(trimmedTitle, combinedDueDate, taskPriority);

  // clear the input after adding
  setTaskTitle("");
  setTaskDueDate("");
  setTaskDueTime("");
  setTaskPriority("none");
  setIsSubmitting(false);
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
  onChange={handleTitleChange}
  maxLength={150}
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
  onChange={(e) => {
    setTaskDueDate(e.target.value);
    if (deadlineError) setDeadlineError(null);
  }}
  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

<input
  type="time"
  value={taskDueTime}
  onChange={(e) => {
    setTaskDueTime(e.target.value);
    if (deadlineError) setDeadlineError(null);
  }}
  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

      <button
  type="submit"
  disabled={isSubmitting || !taskTitle.trim()}
  className={`rounded-xl px-5 py-3 font-semibold text-white transition-colors ${
    isSubmitting || !taskTitle.trim()
      ? "bg-indigo-300 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-700"
  }`}
>
  {isSubmitting ? "Adding..." : "Add Task"}
</button>
    </div>
    {titleError && (
  <p className="mt-2 text-xs text-red-600">{titleError}</p>
)}
{deadlineError && (
  <p className="mt-1 text-xs text-red-600">{deadlineError}</p>
)}
  </form>
);
}