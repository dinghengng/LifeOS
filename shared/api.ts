import { API_URL } from "./config";
import { Task, DBTask, Priority, User } from "./types";


// AUTHENTICATION FLOWS


// Check if user has an active session cookie
export const checkAuthStatus = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Shared API Auth Check failed:", err);
    return null;
  }
};

// Log a user in
export const loginUser = async (email: string, password: string, rememberMe: boolean): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, rememberMe }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed");
  }
  return await response.json();
};

// Register a new user
export const registerUser = async (email: string, password: string, name: string): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Registration failed");
  }
  return await response.json();
};

// Log a user out
export const logoutUser = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/logout`, { 
    method: "POST", 
    credentials: "include" 
  });
  if (!response.ok) throw new Error("Logout failed");
};



// TASK FLOWS (With Session Support)


export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_URL}/tasks`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch");
  const data: DBTask[] = await response.json();
  return data.map((t) => ({
    id: t.id,
    title: t.title,
    isCompleted: t.is_completed,
    dueDate: t.due_date,
    priority: t.priority ?? "none",
  }));
};

export const addTask = async (title: string, dueDate: string | null, priority: Priority): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, dueDate, priority }),
  });
  if (!response.ok) throw new Error("Failed to add");
  const t: DBTask = await response.json();
  return { id: t.id, title: t.title, isCompleted: t.is_completed, dueDate: t.due_date, priority: t.priority };
};

export const toggleTask = async (id: number, isCompleted: boolean): Promise<void> => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ isCompleted }),
  });
  if (!response.ok) throw new Error("Failed to toggle");
};

export const deleteTask = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/tasks/${id}`, { 
    method: "DELETE",
    credentials: "include" 
  });
  if (!response.ok) throw new Error("Failed to delete");
};

export const editTask = async (id: number, updates: { title: string; dueDate: string | null; priority: Priority }): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to edit");
  const t: DBTask = await response.json();
  return { id: t.id, title: t.title, isCompleted: t.is_completed, dueDate: t.due_date, priority: t.priority ?? "none" };
};