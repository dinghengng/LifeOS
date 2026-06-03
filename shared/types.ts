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

export type StressLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface Tag {
  id: number;
  name: string;
  type: "system" | "custom";
}

export interface TagsResponse {
  system: Tag[];
  custom: Tag[];
}

export interface DBMoodLog {
  id: number;
  user_id: number;
  mood_level: MoodLevel;
  stress_level: StressLevel;
  logged_at: string;
  created_at: string;
  tags: Tag[];
}

export interface MoodLog {
  id: number;
  moodLevel: MoodLevel;
  stressLevel: StressLevel;
  loggedAt: string;
  createdAt: string;
  tags: Tag[];
}

export interface CreateMoodLogPayload {
  mood_level: MoodLevel;
  stress_level: StressLevel;
  systemTagIds: number[];
  customTagIds: number[];
  loggedAt?: string; //backfill
}

export interface UpdateMoodLogPayload {
  mood_level?: MoodLevel;
  stress_level?: StressLevel;
  systemTagIds?: number[];
  customTagIds?: number[];
  loggedAt?: string;
}

export interface CreateCustomTagPayload {
  name: string;
}