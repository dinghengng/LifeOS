"use client";

import { useState } from "react";
import { MoodLog, MoodLevel, TagsResponse, Tag, JournalEntry, MoodLevelConfig } from "../../../shared/types";
import { deleteMoodLog, updateJournalEntry, deleteJournalEntry, } from "../../../shared/api";
import EditMoodLogModal from "./EditMoodLogModal";
import EditJournalEntryModal from "./EditJournalEntryModal";
import JournalEditor from "./JournalEditor";

const STRESS_ANCHORS: Record<number, string> = {
  1: "Calm", 2: "Calm", 3: "Relaxed", 4: "Relaxed", 5: "Neutral",
  6: "Neutral", 7: "Tense", 8: "Tense", 9: "Overwhelmed", 10: "Overwhelmed",
};

const MOOD_LABEL: Record<MoodLevel, string> = {
  1: "Awful", 2: "Bad", 3: "Okay", 4: "Good", 5: "Great",
};

function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function deriveTitle(entry: JournalEntry): string {
  if (entry.title?.trim())        return entry.title.trim();
  if (entry.promptUsed?.trim())   return entry.promptUsed.trim();
  if (entry.moodLevel)            return `Felt ${MOOD_LABEL[entry.moodLevel]}`;
  const text = stripHtml(entry.content ?? "").trim();
  if (text)                       return text.slice(0, 60) + (text.length > 60 ? "…" : "");
  return "Untitled Entry";
}

function getMoodDisplay(
  level: MoodLevel,
  moodConfig?: MoodLevelConfig[]
): { emoji: string; label: string; color: string } {
  const cfg = moodConfig?.find((m) => m.level === level);

  return {
    emoji: cfg?.emoji ?? "🙂",
    label: cfg?.label ?? "Mood",
    color: cfg?.color ?? "#6366f1",
  };
}

interface MoodHistoryProps {
  logs: MoodLog[];
  tags: TagsResponse;
  entries?: JournalEntry[];
  moodConfig?: MoodLevelConfig[];  
  onRefresh: () => void;
  onCustomTagCreated: (tag: Tag) => void;
  onCustomTagDeleted: (tagId: number) => void;
}

function LinkToMoodButton({ entry, logs, moodConfig, onLinked }: {
  entry: JournalEntry;
  logs: MoodLog[];
  moodConfig?: MoodLevelConfig[];
  onLinked: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [linking, setLinking] = useState(false);

  const handleLink = async (logId: number) => {
    setLinking(true);
    try {
      await updateJournalEntry(entry.id, { mood_log_id: logId });
      onLinked();
    } catch {
      //silently fail
    } finally {
      setLinking(false);
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
      >
        Link mood
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        autoFocus
        disabled={linking}
        onChange={(e) => e.target.value && handleLink(Number(e.target.value))}
        className="text-xs border border-indigo-300 rounded-lg px-2 py-1 bg-white text-slate-600 max-w-40"
      >
        <option value="">Select mood...</option>
        {logs.map((log) => {
          const mood = getMoodDisplay(log.moodLevel, moodConfig);
          return (
            <option key={log.id} value={log.id}>
              {mood.emoji} {formatLogTime(log.loggedAt)}
            </option>
          );
        })}
      </select>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-slate-400 hover:text-slate-600 transition whitespace-nowrap"
      >
        Cancel
      </button>
    </div>
  );
}


export default function MoodHistory({ logs, tags, entries, moodConfig, onRefresh, onCustomTagCreated, onCustomTagDeleted }: MoodHistoryProps) {
  const [editingLog, setEditingLog] = useState<MoodLog | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);

  const entryByMoodLog = new Map<number, JournalEntry>();
  for (const entry of entries ?? []) {
    if (entry.moodLogId !== null) {
      entryByMoodLog.set(entry.moodLogId, entry);
    }
  }

  const linkedMoodLogIds = new Set(
    (entries ?? [])
      .filter((e) => e.moodLogId !== null)
      .map((e) => e.moodLogId as number)
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this mood entry? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteMoodLog(id);
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not delete entry.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    setDeletingEntryId(id);
    setError(null);
    try {
      await deleteJournalEntry(id);
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not delete entry.");
    } finally {
      setDeletingEntryId(null);
    }
  };

  const unlinkedEntries = (entries ?? []).filter((e) => e.moodLogId === null);

  if (logs.length === 0 && unlinkedEntries.length === 0) {
    return (
      <p className="text-slate-500 text-center mt-6 italic">
        No entries yet. Log your first one above!
      </p>
    );
  }

  return (
    <>
      {/*Edit modal*/}
      {editingLog && (
        <EditMoodLogModal
          log={editingLog}
          tags={tags}
          onSaved={onRefresh}
          onClose={() => setEditingLog(null)}
          onCustomTagCreated={onCustomTagCreated}
          onCustomTagDeleted={onCustomTagDeleted}
        />
      )}

      {/*journal Edit modal*/}
      {editingEntry && (
        <EditJournalEntryModal
          entry={editingEntry}
          logs={logs.filter((log) => log.id === editingEntry.moodLogId || !linkedMoodLogIds.has(log.id))}
          onSaved={onRefresh}
          onClose={() => setEditingEntry(null)}
        />
      )}

      <div className="w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Entries</h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <ul className="space-y-3">
          {logs.map((log) => {
            const mood = getMoodDisplay(log.moodLevel, moodConfig);
            const linkedEntry = entryByMoodLog.get(log.id);
            return (
              <li
                key={log.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow overflow-hidden"
              >
                {/*Mood log row*/}
                <div className="p-4 flex items-start gap-4">
                  {/*Mood emoji*/}
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-[60px]"
                    style={{
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}18`,
                      color: mood.color,
                    }}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs font-semibold mt-0.5">{mood.label}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 mb-0.5">
                      {linkedEntry ? deriveTitle(linkedEntry) : `Felt ${mood.label}`}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">{formatLogTime(log.loggedAt)}</span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Stress: {STRESS_ANCHORS[log.stressLevel]} ({log.stressLevel}/10)
                      </span>
                    </div>

                    {/*Tags*/}
                    {log.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {log.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/*Action buttons*/}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingLog(log)}
                      className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      className={`text-xs px-3 py-1 rounded-lg border transition ${
                        deletingId === log.id
                          ? "border-slate-200 text-slate-400 cursor-not-allowed"
                          : "border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      }`}
                    >
                      {deletingId === log.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>

                {/*Journal*/}
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60">
                  {log.note ? (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                      {stripHtml(log.note)}
                    </p>
                  ) : linkedEntry ? (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {stripHtml(linkedEntry.content ?? "") || "No journal text yet."}
                    </p>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <JournalEditor
                        compact
                        defaultMoodLogId={log.id}
                        onSaved={() => {
                          onRefresh();
                        }}
                        onCancel={() => {}}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          {/*Unlinked journal entries*/}
          {unlinkedEntries.map((entry) => (
              <li
                key={`entry-${entry.id}`}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow overflow-hidden"
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-[60px]">
                    <span className="text-2xl">📝</span>
                    <span className="text-xs font-semibold mt-0.5 text-slate-500">Note</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 mb-0.5">
                      {deriveTitle(entry)}
                    </p>
                    <span className="text-xs text-slate-400">{formatLogTime(entry.createdAt)}</span>
                    {stripHtml(entry.content ?? "") && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {stripHtml(entry.content ?? "").slice(0, 120)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={deletingEntryId === entry.id}
                      className={`text-xs px-3 py-1 rounded-lg border transition ${
                        deletingEntryId === entry.id
                          ? "border-slate-200 text-slate-400 cursor-not-allowed"
                          : "border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      }`}
                    >
                      {deletingEntryId === entry.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60 flex justify-between items-center">
                  {entry.moodLogId === null && (
                    <LinkToMoodButton entry={entry} logs={logs.filter((log) => !linkedMoodLogIds.has(log.id))} moodConfig={moodConfig} onLinked={onRefresh}/>
                  )}
                </div>
              </li>
            ))
          }
        </ul>
      </div>
    </>
  );
}