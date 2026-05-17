// 1. We MUST put this at the very top of interactive Next.js components!
// It tells Next.js: "Hey, this file needs to run in the user's browser, not just on the server."
// “This component must run in the browser (client side), not only on the server.”
"use client"; 

import { useState, SyntheticEvent } from "react"; // In short, useState allows a React component to: remember data, change data when users interact, automatically update the UI when the data changes

// 1. Tell TypeScript we expect a function called 'onAddTask'
interface NewTaskFormProps {
  onAddTask: (task: string) => void;
}

export default function NewTaskForm({ onAddTask }: NewTaskFormProps) {
  // 2. This is React State! 
  // 'taskTitle' is the current text. 
  // 'setTaskTitle' is the function we use to update it.
  const [taskTitle, setTaskTitle] = useState("");

  // 3. This function runs when the user clicks "Add" or hits Enter
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents the browser from refreshing the page
    
    if (taskTitle.trim() === "") return; // Don't add empty tasks

    //we trigger the wire and send the text!
    onAddTask(taskTitle);

    // Clear the input box after adding
    setTaskTitle(""); 
  };

  return (
    // 4. We use a <form> tag so the user can press the 'Enter' key to submit
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input 
        type="text" 
        placeholder="What needs to be done?" 
        // 5. We connect the input box directly to our React State memory
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        className="border border-slate-300 rounded-lg p-2 w-full focus:outline-none focus:border-indigo-500"
      />
      <button 
        type="submit" 
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        Add
      </button>
    </form>
  );
}