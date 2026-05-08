"use client"

export default function TaskList({ tasks, onDeleteTask }) {
  return (
    <div>
      <h2>Your Tasks</h2>
      <ul>
        {tasks.map((task, index) => (
          <li key={index}>
            {task}
            <button 
              onClick={() => onDeleteTask(index)}
              className="ml-2 text-red-500 hover:text-red-700 font-bold"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}