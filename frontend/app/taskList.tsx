"use client"; // Always at the very top!

// Import the Task interface we just created in the Page file
import { Task } from "./page";

//defines what it takes in and produces
interface TaskListProps {
  tasks: Task[]; // Now it expects an array of Task objects!
  onToggleTask: (id: number) => void; //takes in id of type number and returns void
}

export default function TaskList({ tasks, onToggleTask }: TaskListProps) {
  
  if (tasks.length === 0) {
    return <p className="text-slate-500 text-center mt-4">No tasks yet. Add one above!</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-700 mb-4">Your Tasks</h2>
      
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li 
            key={task.id} 
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              task.isCompleted ? "bg-slate-100 border-slate-200" : "bg-slate-50 border-slate-300"
            }`} // If the task is completed, we give it a lighter background and border color
          > 
          {/* We have a checkbox and the task title on the left, and a delete button on the right. */}
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={task.isCompleted}
                onChange={() => onToggleTask(task.id)}
                className="w-5 h-5 cursor-pointer accent-indigo-600" 
              /> 

              {/* If the task is completed, we strike through the text and make it lighter. Otherwise, it's normal. */}
              <span className={`font-medium ${
                task.isCompleted ? "line-through text-slate-400" : "text-slate-700"
              }`}>
                {task.title}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}