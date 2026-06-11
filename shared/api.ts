import { API_URL } from "./config";
import { Task, DBTask, Priority, User, MoodLevel, MoodLevelConfig, EmojiPack, SaveMoodConfigPayload} from "./types";

// Helper function to build authorization headers dynamically for mobile requests
const getAuthHeaders = async (headers: Record<string, string> = {}): Promise<Record<string, string>> => {
  const baseHeaders: Record<string, string> = { ...headers };

  try {
    if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
      const dynamicRequire = new Function("module", "return require(module)");
      const SecureStore = dynamicRequire("expo-secure-store");
      const token = await SecureStore.getItemAsync("userToken");
      if (token) {
        baseHeaders["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {
  }

  return baseHeaders;
};
// AUTHENTICATION FLOWS


// Check if user has an active session cookie (Web) or active SecureStore Token (Mobile)
export const checkAuthStatus = async (): Promise<User | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: "include",
      headers
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Shared API Auth Check failed:", err);
    return null;
  }
};

// Log a user in
export const loginUser = async (email: string, password: string, rememberMe: boolean): Promise<User & { token?: string }> => {
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
export const registerUser = async (email: string, password: string, name: string): Promise<User & { token?: string }> => {
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
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers
  });
  if (!response.ok) throw new Error("Logout failed");
};


// TASK FLOWS (With Session Support)
export const fetchTasks = async (): Promise<Task[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/tasks`, {
    credentials: "include",
    headers
  });
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
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ title, dueDate, priority }),
  });
  if (!response.ok) throw new Error("Failed to add");
  const t: DBTask = await response.json();
  return { id: t.id, title: t.title, isCompleted: t.is_completed, dueDate: t.due_date, priority: t.priority };
};

export const toggleTask = async (id: number, isCompleted: boolean): Promise<void> => {
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify({ isCompleted }),
  });
  if (!response.ok) throw new Error("Failed to toggle");
};

export const deleteTask = async (id: number): Promise<void> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers
  });
  if (!response.ok) throw new Error("Failed to delete");
};

export const editTask = async (id: number, updates: { title: string; dueDate: string | null; priority: Priority }): Promise<Task> => {
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to edit");
  const t: DBTask = await response.json();
  return { id: t.id, title: t.title, isCompleted: t.is_completed, dueDate: t.due_date, priority: t.priority ?? "none" };
};

// MOOD API
import {
  Tag, TagsResponse, MoodLog, DBMoodLog, CreateMoodLogPayload, UpdateMoodLogPayload
} from "./types";

//maps sql snake_case to camelCase
const mapMoodLog = (raw: DBMoodLog): MoodLog => ({
  id: raw.id,
  moodLevel: raw.mood_level,
  stressLevel: raw.stress_level,
  loggedAt: raw.logged_at,
  createdAt: raw.created_at,
  tags: raw.tags,
  note: raw.note ?? null,
});

// GET all tags
export const fetchTags = async (): Promise<TagsResponse> => {
  const response = await fetch(`${API_URL}/mood/tags`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch tags");
  return await response.json();
};

// GET all mood logs
export const fetchMoodLogs = async (): Promise<MoodLog[]> => {
  const response = await fetch(`${API_URL}/mood/logs`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch mood logs");
  const data: DBMoodLog[] = await response.json();
  return data.map(mapMoodLog);
};

// POST create a new mood log
export const createMoodLog = async (payload: CreateMoodLogPayload): Promise<MoodLog> => {
  const response = await fetch(`${API_URL}/mood/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create mood log");
  }
  const data: DBMoodLog = await response.json();
  return mapMoodLog(data);
};

// PATCH edit mood log
export const updateMoodLog = async (id: number, payload: UpdateMoodLogPayload): Promise<MoodLog> => {
  const response = await fetch(`${API_URL}/mood/logs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to update mood log");
  }
  const data: DBMoodLog = await response.json();
  return mapMoodLog(data);
};

// DELETE mood log
export const deleteMoodLog = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/mood/logs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to delete mood log");
  }
};

// POST create a custom "Other" tag
export const createCustomTag = async (name: string): Promise<Tag> => {
  const response = await fetch(`${API_URL}/mood/tags/custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create custom tag");
  }
  return await response.json();
};

// Journal api
import { JournalEntry, DBJournalEntry, CreateJournalEntryPayload, UpdateJournalEntryPayload, } from "./types";

// Helper that maps snake case journal entry to camel case
const mapJournalEntry = (raw: DBJournalEntry): JournalEntry => ({
  id: raw.id,
  moodLogId: raw.mood_log_id,
  content: raw.content,
  promptUsed: raw.prompt_used,
  title: raw.title ?? null,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
  moodLevel: raw.mood_level,
  stressLevel: raw.stress_level,
  moodLoggedAt: raw.mood_logged_at,
});

// GET journal entries
export const fetchJournalEntries = async (): Promise<JournalEntry[]> => {
  const response = await fetch(`${API_URL}/journal`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch journal entries");
  const data: DBJournalEntry[] = await response.json();
  return data.map(mapJournalEntry);
};

// POST create journal entry
export const createJournalEntry = async (payload: CreateJournalEntryPayload): Promise<JournalEntry> => {
  const response = await fetch(`${API_URL}/journal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create journal entry");
  }
  const data: DBJournalEntry = await response.json();
  return mapJournalEntry(data);
};

// PATCH update journal entry
export const updateJournalEntry = async (id: number, payload: UpdateJournalEntryPayload): Promise<JournalEntry> => {
  const response = await fetch(`${API_URL}/journal/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to update journal entry");
  }
  const data: DBJournalEntry = await response.json();
  return mapJournalEntry(data);
};

// DELETE journal entry
export const deleteJournalEntry = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/journal/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to delete journal entry");
  }
};

// Mood config
const mapMoodLevelConfig = (raw: {
  id: number;
  level: number;
  label: string;
  emoji: string;
  color: string;
  display_order: number;
}): MoodLevelConfig => ({
  id: raw.id,
  level: raw.level as MoodLevel,
  label: raw.label,
  emoji: raw.emoji,
  color: raw.color,
  displayOrder: raw.display_order,
});

export const fetchMoodConfig = async (): Promise<MoodLevelConfig[]> => {
  const response = await fetch(`${API_URL}/mood/config`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch mood config");
  const data = await response.json();
  return data.map(mapMoodLevelConfig);
};

export const saveMoodConfig = async (
  payload: SaveMoodConfigPayload
): Promise<MoodLevelConfig[]> => {
  const response = await fetch(`${API_URL}/mood/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to save mood config");
  }
  const data = await response.json();
  return data.map(mapMoodLevelConfig);
};

export const fetchEmojiPacks = async (): Promise<EmojiPack[]> => {
  const response = await fetch(`${API_URL}/mood/emoji-packs`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch emoji packs");
  const data = await response.json();
  return data.map(
    (p: { id: number; name: string; emojis: string[]; is_default: boolean }) => ({
      id: p.id,
      name: p.name,
      emojis: p.emojis,
      isDefault: p.is_default,
    })
  );
};