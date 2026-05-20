"use client"; // Tells Next.js this component is interactive (checkboxes/buttons)

import { Task } from "../app/page";

// We added 'onDeleteTask' to the list of required items.
interface TaskListProps {
  tasks: Task[]; 
  onToggleTask: (id: number) => void; 
  onDeleteTask: (id: number) => void; 
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

// THE COMPONENT: We grab all three props at once here.
export default function TaskList({ tasks, onToggleTask, onDeleteTask }: TaskListProps) {
  
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
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              task.isCompleted 
                ? "bg-slate-100 border-slate-200 opacity-75" 
                : "bg-white border-slate-300 shadow-sm"
            }`}
          > 
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
                <span className={`font-medium transition-all ${
                  task.isCompleted ? "line-through text-slate-400" : "text-slate-700"
                  }`}>
                  {task.title}
                </span>

                {/* DEADLINE: Only show if we have one */}
                {task.dueDate && (
                  <span className="text-xs text-slate-500">
                  {formatDeadline(task.dueDate)}
                   </span>
                )}
              </div>
            </div>

            {/* DELETE BUTTON: Triggers the delete function */}
            <button 
              onClick={() => onDeleteTask(task.id)}
              className="text-slate-400 hover:text-red-500 transition-colors px-2 text-xl"
              title="Delete task"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}