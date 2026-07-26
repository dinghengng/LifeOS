"use client"; // Tells Next.js this component is interactive (checkboxes/buttons)

import { useState } from "react";
import { Task, type Priority } from "../../shared/types";
import { useTranslation } from "../context/LanguageContext";

// added onDeleteTask to the list of required items.
interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onEditTask: (task: Task) => void;
}

// helper function for deadline formatting
function formatDeadline(isoString: string, locale: string): string {
  const date = new Date(isoString);
  const localeTag = locale === "zh" ? "zh-CN" : "en-GB";
  return date.toLocaleString(localeTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// check if a task is overdue
const taskIsOverdue = (dateString: string | null, isCompleted: boolean) => {
  if (!dateString || isCompleted) return false;
  return new Date(dateString).getTime() < new Date().getTime();
};

// priority color and label
const priorityColors: Record<Priority, string> = {
  critical: "bg-red-500",
  high: "bg-amber-400",
  low: "bg-emerald-500",
  none: "bg-slate-200",
};

// to match label colours
const priorityBadgeStyles: Record<Priority, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  none: "bg-slate-50 text-slate-600 border-slate-200",
};

const priorityLabelKeys: Record<Priority, "priority.critical" | "priority.high" | "priority.low" | "priority.none"> = {
  critical: "priority.critical",
  high: "priority.high",
  low: "priority.low",
  none: "priority.none",
};

// THE COMPONENT: We grab all three props at once here.
export default function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}: TaskListProps) {
  const { t, locale } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const pendingTask = tasks.find((task) => task.id === confirmDeleteId) ?? null;

  const confirmDelete = () => {
    if (confirmDeleteId === null) return;
    onDeleteTask(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  // Shows a friendly message if the user has a clear schedule.
  if (tasks.length === 0) {
    return (
      <p className="text-slate-500 text-center mt-6 italic">
        {t("taskList.empty")}
      </p>
    );
  }
  //remaining tasks
  const remainingCount = tasks.filter((task) => !task.isCompleted).length;
  return (
    <div className="mt-6">
      {/*Delete confirmation modal*/}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5">
            <p className="text-sm text-slate-700 mb-4">
              {t("taskList.confirmDeleteTask", { title: pendingTask?.title ?? "" })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-4 border-b border-slate-200 pb-2">
        <h2 className="text-xl font-bold text-slate-800">{t("taskList.heading")}</h2>
        <span className="text-sm font-medium text-slate-500">
          {t("taskList.remaining", { count: remainingCount })}
        </span>
      </div>

      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id} // Essential for React to keep track of which item is which
          >
            <div
              className={`flex items-stretch rounded-lg border overflow-hidden transition-all duration-300 ${
                task.isCompleted
                  ? "bg-slate-50 border-slate-200 opacity-50 grayscale" // completed tasks look faded
                  : "bg-white border-slate-300 shadow-sm"
              }`}
            >
              {/* PRIORITY BAR: shows task priority visually on the left */}
              <div className={`w-2 ${priorityColors[task.priority]}`} />

              <div className="flex-1 flex items-center justify-between p-3 gap-3">
                {/* Checkbox + Title/Deadline Column */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* CHECKBOX */}
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => onToggleTask(task.id)}
                    className="w-5 h-5 cursor-pointer accent-indigo-600 flex-none"
                  />

                  {/* TEXT COLUMN */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-medium transition-all truncate ${
                        task.isCompleted
                          ? "line-through text-slate-400"
                          : "text-slate-700"
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Deadline and priority on the same row */}
                    {(task.dueDate || task.priority !== "none") && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {task.dueDate && (
                          <span
                            className={`font-medium flex items-center gap-1 ${
                              taskIsOverdue(task.dueDate, task.isCompleted)
                                ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100"
                                : "text-slate-500"
                            }`}
                          >
                            {taskIsOverdue(task.dueDate, task.isCompleted)
                              ? t("taskList.overdue")
                              : t("taskList.due")}{" "}
                            {formatDeadline(task.dueDate, locale)}
                          </span>
                        )}

                        {task.priority !== "none" && (
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${priorityBadgeStyles[task.priority]}`}
                          >
                            {t(priorityLabelKeys[task.priority])}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/*Changed format*/}
                <div className="flex items-center gap-1 flex-none">
                  <button
                    onClick={() => onEditTask(task)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-2 text-lg"
                    title={t("taskList.editTitle")}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(task.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 text-xl"
                    title={t("taskList.deleteTitle")}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}