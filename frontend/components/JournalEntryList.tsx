"use client";

import { JournalEntry, MoodLevel } from "../../shared/types";

const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

interface JournalEntryListProps {
  entries: JournalEntry[];
}

export default function JournalEntryList({ entries }: JournalEntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-slate-500 text-center mt-4 italic">
        No journal entries yet. Write your first one above!
      </p>
    );
  }

  return (
    <div className="w-full max-w-3xl mt-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Journal Entries</h2>
      <ul className="space-y-3">
        {entries.map((entry) => {
          const preview = stripHtml(entry.content);
          return (
            <li
              key={entry.id}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-xs text-slate-400">{formatDate(entry.createdAt)}</span>
                {/*link entry to a mood log*/}
                {entry.moodLevel && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {MOOD_EMOJI[entry.moodLevel]} Mood logged
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700 line-clamp-2">
                {preview || <span className="italic text-slate-400">Empty entry</span>}
              </p>

              {/*Prompt badge*/}
              {entry.promptUsed && (
                <p className="text-xs text-slate-400 mt-2 italic line-clamp-1">
                  Prompt: "{entry.promptUsed}"
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}