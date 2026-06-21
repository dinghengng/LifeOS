// We MUST put this at the very top of interactive Next.js components!
// tells Next.js this file needs to run in the user's browser, not just on the server itself
"use client";

import { useState, SyntheticEvent } from "react"; // In short, useState allows a React component to: remember data, change data when users interact, automatically update the UI when the data changes
import { useToastContext } from "../components/ToastContext";

type Priority = "critical" | "high" | "low" | "none";
// Tell TypeScript we expect a function called 'onAddTask'
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
  const { showToast } = useToastContext(); //toast noti

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
    showToast("Task added successfully"); //toast confirmation noti

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
      className="mb-6 rounded-2xl border border-white/40 bg-white/40 backdrop-blur-md p-3 shadow-sm transition-all duration-300 focus-within:bg-white/60 focus-within:shadow-md"
    >
      {/* Main Flex Row: Stacks on mobile, forms a single row on large screens */}
      <div className="flex flex-col lg:flex-row gap-2 items-center">
        <input
          type="text"
          autoFocus
          placeholder="What needs to be done?"
          value={taskTitle}
          onChange={handleTitleChange}
          maxLength={150}
          className="w-full lg:flex-[2] rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <div className="flex w-full lg:w-auto gap-2">
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value as Priority)}
            className="flex-1 lg:w-24 rounded-xl border border-slate-200 bg-white/80 px-2 py-2 text-sm text-slate-700 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
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
            className="flex-1 lg:w-32 rounded-xl border border-slate-200 bg-white/80 px-2 py-2 text-sm text-slate-700 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          />

          <input
            type="time"
            value={taskDueTime}
            onChange={(e) => {
              setTaskDueTime(e.target.value);
              if (deadlineError) setDeadlineError(null);
            }}
            className="flex-1 lg:w-24 rounded-xl border border-slate-200 bg-white/80 px-2 py-2 text-sm text-slate-700 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          />

          <button
            type="submit"
            disabled={isSubmitting || !taskTitle.trim()}
            className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 active:scale-95 ${
              isSubmitting || !taskTitle.trim()
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {isSubmitting ? "..." : "Add"}
          </button>
        </div>
      </div>
      {(titleError || deadlineError) && (
        <div className="mt-2 px-2 flex gap-4">
          {titleError && <p className="text-xs font-medium text-red-500">{titleError}</p>}
          {deadlineError && <p className="text-xs font-medium text-red-500">{deadlineError}</p>}
        </div>
      )}
    </form>
  );
}