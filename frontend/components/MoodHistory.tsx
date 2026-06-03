"use client";

import { useState } from "react";
import { MoodLog, MoodLevel, TagsResponse } from "../../shared/types";
import { deleteMoodLog } from "../../shared/api";
import EditMoodLogModal from "./EditMoodLogModal";

const MOOD_CONFIG: Record<MoodLevel, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😢", label: "Awful",  color: "bg-red-100 text-red-700 border-red-200"      },
  2: { emoji: "😕", label: "Bad",    color: "bg-orange-100 text-orange-700 border-orange-200" },
  3: { emoji: "😐", label: "Okay",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  4: { emoji: "🙂", label: "Good",   color: "bg-green-100 text-green-700 border-green-200"  },
  5: { emoji: "😄", label: "Great",  color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};

const STRESS_ANCHORS: Record<number, string> = {
  1: "Calm", 2: "Calm", 3: "Relaxed", 4: "Relaxed", 5: "Neutral",
  6: "Neutral", 7: "Tense", 8: "Tense", 9: "Overwhelmed", 10: "Overwhelmed",
};

function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface MoodHistoryProps {
  logs: MoodLog[];
  tags: TagsResponse;  
  onRefresh: () => void;
}

export default function MoodHistory({ logs, tags, onRefresh }: MoodHistoryProps) {
  const [editingLog, setEditingLog] = useState<MoodLog | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (logs.length === 0) {
    return (
      <p className="text-slate-500 text-center mt-6 italic">
        No mood entries yet. Log your first one above!
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
            const mood = MOOD_CONFIG[log.moodLevel];
            return (
              <li
                key={log.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow p-4 flex items-start gap-4"
              >
                {/*Mood emoji*/}
                <div className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-[60px] ${mood.color}`}>
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-semibold mt-0.5">{mood.label}</span>
                </div>

                <div className="flex-1 min-w-0">
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
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}