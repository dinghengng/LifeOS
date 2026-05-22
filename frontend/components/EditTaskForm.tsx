// duplicated from NewTaskForm.tsx
"use client";

import { useState, useEffect } from "react";
import type { Task, Priority } from "../app/page";

interface EditTaskFormProps {
  task: Task;
  onSave: (updates: {
    title: string;
    dueDate: string | null;
    priority: Priority;
  }) => void;
  onCancel: () => void;
}

export default function EditTaskForm({
  task,
  onSave,
  onCancel,
}: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
const [deadlineError, setDeadlineError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialise due date fields 
  useEffect(() => {
    if (task.dueDate) {
      const d = new Date(task.dueDate);
  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyyMmDd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}`;
  const hhMm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  setDate(yyyyMmDd);
  setTime(hhMm);
    } else {
      setDate("");
      setTime("");
    }
  }, [task]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value.slice(0, 150);
  setTitle(value);

  if (titleError && value.trim().length > 0) {
    setTitleError(null);
  }
};

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    setTitleError("Title cannot be empty.");
    return;
  }

  setIsSubmitting(true);
  setTitleError(null);
  setDeadlineError(null);

  let combinedDueDate: string | null = null;
  const now = new Date();

  // Graceful removal: if BOTH fields empty, treat as no deadline
  if (!date && !time) {
    combinedDueDate = null;
  } else {
    const todayStr = now.toISOString().slice(0, 10);
    const dateStr = date || todayStr;
    const [year, month, day] = dateStr.split("-").map(Number);

    const timeStr = time || "23:59";
    const [hour, minute] = timeStr.split(":").map(Number);

    const localDate = new Date(year, month - 1, day, hour, minute);

    if (localDate.getTime() <= now.getTime()) {
      setDeadlineError("Deadline must be in the future.");
      setIsSubmitting(false);
      return;
    }

    combinedDueDate = localDate.toISOString();
  }

  onSave({
    title: trimmedTitle,
    dueDate: combinedDueDate,
    priority,
  });

  setIsSubmitting(false);
};

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">
          Editing: <span className="font-bold">{task.title}</span>
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
  type="text"
  value={title}
  onChange={handleTitleChange}
  maxLength={150}
  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  placeholder="Task title"
/>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="none">Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>

        <input
  type="date"
  value={date}
  onChange={(e) => {
    setDate(e.target.value);
    if (deadlineError) setDeadlineError(null);
  }}
  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

<input
  type="time"
  value={time}
  onChange={(e) => {
    setTime(e.target.value);
    if (deadlineError) setDeadlineError(null);
  }}
  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

        <button
  type="submit"
  disabled={isSubmitting || !title.trim()}
  className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
    isSubmitting || !title.trim()
      ? "bg-indigo-300 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-700"
  }`}
>
  {isSubmitting ? "Saving..." : "Save changes"}
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