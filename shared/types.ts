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

export interface DBJournalEntry {
  id: number;
  mood_log_id: number | null;
  content: string;
  prompt_used: string | null;
  created_at: string;
  updated_at: string;
  mood_level: MoodLevel | null;
  stress_level: StressLevel | null;
  mood_logged_at: string | null;
}

export interface JournalEntry {
  id: number;
  moodLogId: number | null;
  content: string;
  promptUsed: string | null;
  createdAt: string;
  updatedAt: string;
  moodLevel: MoodLevel | null;
  stressLevel: StressLevel | null;
  moodLoggedAt: string | null;
}

export interface CreateJournalEntryPayload {
  content: string;
  mood_log_id?: number | null;
  prompt_used?: string | null;
}