import { API_URL } from "./config";
import { Task, DBTask, Priority } from "./types";

// 1. All your API interaction functions
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_URL}/tasks`);
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
    body: JSON.stringify({ title, dueDate, priority }),
  });
  if (!response.ok) throw new Error("Failed to add");
  const t: DBTask = await response.json();
  return { id: t.id, title: t.title, isCompleted: t.is_completed, dueDate: t.due_date, priority: t.priority };
};

// 2. All your Data Transformation Logic (The "Brain")
export const hasDueTime = (dueDate: string | null): boolean => !!dueDate;

export const formatDeadline = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

export const isOverdue = (dateString: string | null, isCompleted: boolean): boolean => {
  if (!dateString || isCompleted) return false;
  return new Date(dateString).getTime() < new Date().getTime();
};