"use client"; // Tells Next.js this component is interactive (checkboxes/buttons)

import { Task, type Priority } from "../app/page";

// We added 'onDeleteTask' to the list of required items.
interface TaskListProps {
  tasks: Task[]; 
  onToggleTask: (id: number) => void; 
  onDeleteTask: (id: number) => void;
  onEditTask: (task: Task) => void; 
}

// helper function for deadline formatting
function formatDeadline(isoString: string): string {
  const date = new Date(isoString);
  return `Due: ${date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// priority color and label
const priorityColors: Record<Priority, string> = {
  critical: "bg-red-500",
  high: "bg-yellow-400",
  low: "bg-green-500",
  none: "bg-gray-300",
};

// to match label colours
const priorityBadgeStyles: Record<Priority, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  none: "bg-slate-50 text-slate-600 border-slate-200",
};

const priorityLabel: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  low: "Low",
  none: "None",
};

// THE COMPONENT: We grab all three props at once here.
export default function TaskList({ tasks, onToggleTask, onDeleteTask, onEditTask, }: TaskListProps) {
  
  // Shows a friendly message if the user has a clear schedule.
  if (tasks.length === 0) {
    return (
      <p className="text-slate-500 text-center mt-6 italic">
        No tasks yet. Take a break!
      </p>
    );
  }

  return (
  <div className="mt-6">
    <h2 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">
      Your Tasks
    </h2>

    <ul className="space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id} // Essential for React to keep track of which item is which
        >
          <div
            className={`flex items-stretch rounded-lg border overflow-hidden transition-all ${
              task.isCompleted
                ? "bg-slate-100 border-slate-200 opacity-75"
                : "bg-white border-slate-300 shadow-sm"
            }`}
          >
            {/* PRIORITY BAR: shows task priority visually on the left */}
            <div className={`w-2 ${priorityColors[task.priority]}`} />

            <div className="flex-1 flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                {/* CHECKBOX: Triggers the toggle function */}
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onToggleTask(task.id)}
                  className="w-5 h-5 cursor-pointer accent-indigo-600"
                />

                <div className="flex flex-col">
                  {/* TEXT: Strikes through if task.isCompleted is true */}
                  <span
                    className={`font-medium transition-all ${
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
      <span>{formatDeadline(task.dueDate)}</span>
    )}

    {task.priority !== "none" && (
  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${priorityBadgeStyles[task.priority]}`}>
    {priorityLabel[task.priority]}
  </span>
  )}
  </div>
)}
                </div>
              </div>

              <div className="flex items-center gap-1">
  {/* EDIT BUTTON: opens the edit popup */}
  <button
    onClick={() => onEditTask(task)}
    className="text-slate-400 hover:text-slate-700 transition-colors px-2 text-lg"
    title="Edit task"
  >
    ✎
  </button>

  {/* DELETE BUTTON: Triggers the delete function */}
  <button
    onClick={() => onDeleteTask(task.id)}
    className="text-slate-400 hover:text-red-500 transition-colors px-2 text-xl"
    title="Delete task"
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