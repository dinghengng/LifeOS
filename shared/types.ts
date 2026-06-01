export type Priority = "critical" | "high" | "low" | "none";

export interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate: string | null;
  priority: Priority;
}

export interface DBTask {
  id: number;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  priority: Priority;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
}