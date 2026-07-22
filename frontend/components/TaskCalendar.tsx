"use client";

import { useMemo, useState } from "react";
import { Task, Priority } from "../../shared/types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Same priority order used for sorting on the Tasks page 
const priorityRank: Record<Priority, number> = {
  critical: 1,
  high: 2,
  low: 3,
  none: 4,
};

// Matches priorityColors as the calendar reads the same
const priorityDotStyles: Record<Priority, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-amber-400 text-slate-900",
  low: "bg-emerald-500 text-white",
  none: "bg-slate-300 text-slate-700",
};

const priorityBadgeStyles: Record<Priority, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  none: "bg-slate-50 text-slate-600 border-slate-200",
};


function toSGT(d: Date) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 8 * 60 * 60 * 1000);
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

interface TaskCalendarProps {
  tasks: Task[];
}

export default function TaskCalendar({ tasks }: TaskCalendarProps) {
  const today = useMemo(() => toSGT(new Date()), []);
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Group tasks by due date, keyed by "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = dateKey(toSGT(new Date(task.dueDate)));
      const existing = map.get(key) || [];
      existing.push(task);
      map.set(key, existing);
    }
    // Sort each day's tasks by priority so the "top" priority is easy to read
    for (const list of map.values()) {
      list.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    }
    return map;
  }, [tasks]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const todayKey = dateKey(today);

  const goPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
    setSelectedKey(null);
  };
  const goNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
    setSelectedKey(null);
  };
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(todayKey);
  };

  const selectedTasks = selectedKey ? tasksByDate.get(selectedKey) || [] : [];
  const selectedLabel = selectedKey
    ? new Date(selectedKey + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrevMonth}
          className="text-slate-400 hover:text-slate-700 px-2 text-lg leading-none"
          aria-label="Previous month"
        >
          ‹
        </button>
        <button
          onClick={goToday}
          className="text-sm font-bold tracking-wider text-red-500 hover:opacity-80"
        >
          {monthLabel} {year}
        </button>
        <button
          onClick={goNextMonth}
          className="text-slate-400 hover:text-slate-700 px-2 text-lg leading-none"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAYS.map((wd, i) => (
          <div key={i} className="text-xs font-semibold text-slate-400">
            {wd}
          </div>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = dateKey(date);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const dayTasks = tasksByDate.get(key) || [];
          const hasTasks = dayTasks.length > 0;
          const topPriority = hasTasks ? dayTasks[0].priority : null;

          return (
            <button
              key={i}
              onClick={() => setSelectedKey(isSelected ? null : key)}
              className="flex flex-col items-center justify-center gap-0.5 py-1"
              title={
                hasTasks
                  ? `${dayTasks.length} task${dayTasks.length > 1 ? "s" : ""} due`
                  : undefined
              }
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium transition-all ${
                  hasTasks && topPriority
                    ? priorityDotStyles[topPriority]
                    : "text-slate-700 hover:bg-slate-100"
                } ${isToday ? "ring-2 ring-red-400 ring-offset-1" : ""} ${
                  isSelected ? "ring-2 ring-slate-800 ring-offset-1" : ""
                }`}
              >
                {date.getDate()}
              </span>
              {hasTasks && (
                <span className="flex gap-0.5">
                  {dayTasks.slice(0, 3).map((t, idx) => (
                    <span
                      key={idx}
                      className={`w-1 h-1 rounded-full ${priorityDotStyles[t.priority].split(" ")[0]}`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedKey && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">
            {selectedLabel}
          </h4>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-slate-400">No tasks due this day.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span
                    className={`text-sm ${
                      task.isCompleted
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.priority !== "none" && (
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityBadgeStyles[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}