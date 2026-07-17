// duplicated from NewTaskForm.tsx
"use client";

import { useState, useEffect } from "react";
import type { Task, Priority } from "../../shared/types";
import { useToastContext } from "../components/notifications/ToastContext";
import { useTranslation } from "../context/LanguageContext";

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
  const { t } = useTranslation();

  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToastContext();

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
    setTitleError(t("editTaskForm.errorTitleEmpty"));
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
      setDeadlineError(t("editTaskForm.errorDeadlineFuture"));
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
  showToast(t("editTaskForm.toastUpdated")); //toast noti
  setIsSubmitting(false);
};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
  <div className="mb-1 flex items-center justify-between gap-2">
    <p className="text-xs text-slate-500">
      {t("editTaskForm.editing")} <span className="font-semibold text-slate-700">{task.title}</span>
    </p>
    <button
      type="button"
      onClick={onCancel}
      className="text-xs text-slate-500 hover:text-slate-700"
    >
      {t("editTaskForm.cancel")}
    </button>
  </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
  type="text"
  value={title}
  onChange={handleTitleChange}
  maxLength={150}
  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  placeholder={t("editTaskForm.placeholder")}
/>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="none">{t("priority.placeholder")}</option>
          <option value="critical">{t("priority.critical")}</option>
          <option value="high">{t("priority.high")}</option>
          <option value="low">{t("priority.low")}</option>
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
  {isSubmitting ? t("editTaskForm.saving") : t("editTaskForm.save")}
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