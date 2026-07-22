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
  note?: string | null;
}

export interface MoodLog {
  id: number;
  moodLevel: MoodLevel;
  stressLevel: StressLevel;
  loggedAt: string;
  createdAt: string;
  tags: Tag[];
  note?: string | null;
}

export interface CreateMoodLogPayload {
  mood_level: MoodLevel;
  stress_level: StressLevel;
  systemTagIds: number[];
  customTagIds: number[];
  loggedAt?: string; //backfill
  note?: string;
}

export interface UpdateMoodLogPayload {
  mood_level?: MoodLevel;
  stress_level?: StressLevel;
  systemTagIds?: number[];
  customTagIds?: number[];
  loggedAt?: string;
  note?: string | null;
}

export interface CreateCustomTagPayload {
  name: string;
}

export interface DBJournalEntry {
  id: number;
  mood_log_id: number | null;
  content: string;
  prompt_used: string | null;
  title?: string | null;
  created_at: string;
  updated_at: string;
  mood_level: MoodLevel | null;
  stress_level: StressLevel | null;
  mood_logged_at: string | null;
  ai_mood_score: number | null;
  ai_themes: string[] | null;
  ai_confidence: "low" | "medium" | "high" | null;
  ai_analyzed_at: string | null;
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
  title?: string | null;
  aiMoodScore: number | null;
  aiThemes: string[] | null;
  aiConfidence: "low" | "medium" | "high" | null;
  aiAnalyzedAt: string | null;
}

export interface CreateJournalEntryPayload {
  content: string;
  mood_log_id?: number | null;
  prompt_used?: string | null;
  title?: string;
}

export interface UpdateJournalEntryPayload {
  content?: string;
  mood_log_id?: number | null;
  title?: string | null;
}

export interface MoodLevelConfig {
  id: number;
  level: MoodLevel;
  label: string;
  emoji: string;
  color: string;
  displayOrder: number;
}

export interface EmojiPack {
  id: number;
  name: string;
  emojis: string[];
  isDefault: boolean;
}

export interface SaveMoodConfigPayload {
  levels: {
    level: MoodLevel;
    label: string;
    emoji: string;
    color: string;
    display_order: number;
  }[];
}

export type ChallengePeriodType = "weekly" | "monthly";
export type ChallengeTier = "bronze" | "silver" | "gold";

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  period: ChallengePeriodType;
  source: string;
  tiers: {
    bronze: number;
    silver: number;
    gold: number;
  };
}

export interface ChallengeProgress extends ChallengeDefinition {
  count: number;
  tier: "bronze" | "silver" | "gold" | null;
  nextTier: "bronze" | "silver" | "gold" | null;
  remainingToNext: number | null;
  periodStart: string;
  periodEnd: string;
  implemented: boolean;
}

export interface UserSearchResult {
  id: number;
  name: string | null;
  username: string;
}

export interface PublicProfile {
  id: number;
  name: string | null;
  username: string;
}

export interface ProfilePost {
  id: number;
  challengeId: string;
  challengeTitle: string;
  tier: "bronze" | "silver" | "gold";
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  kudosCount: number;
  hasKudosed: boolean;
}