"use client";

import { useState } from "react";
import { JournalEntry, MoodLog, MoodLevel, UpdateJournalEntryPayload } from "../../shared/types";
import { updateJournalEntry } from "../../shared/api";

const MOOD_CONFIG: Record<MoodLevel, { emoji: string; label: string }> = {
  1: { emoji: "😢", label: "Awful" },
  2: { emoji: "😕", label: "Bad"   },
  3: { emoji: "😐", label: "Okay"  },
  4: { emoji: "🙂", label: "Good"  },
  5: { emoji: "😄", label: "Great" },
};

function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface EditJournalEntryModalProps {
  entry: JournalEntry;
  logs: MoodLog[];
  onSaved: () => void;
  onClose: () => void;
}

export default function EditJournalEntryModal({ entry, logs, onSaved, onClose }: EditJournalEntryModalProps) {
  const [title, setTitle]     = useState(entry.title ?? "");
  const [content, setContent] = useState(entry.content ?? "");
  const [linkedMoodId, setLinkedMoodId] = useState<number | null>(entry.moodLogId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Content cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const payload: UpdateJournalEntryPayload = {
      title: title.trim() || null,
      content: content.trim(),
      mood_log_id: linkedMoodId,
    };

    try {
      await updateJournalEntry(entry.id, payload);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Edit Journal Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>

        {/*Title*/}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Title</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your entry a title..."
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>

        {/*Text*/}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Reflection</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Write your reflection..."
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none"
          />
        </div>

        {/*Link moodlog*/}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Linked Mood</p>
          <select
            value={linkedMoodId ?? ""}
            onChange={(e) => setLinkedMoodId(e.target.value ? Number(e.target.value) : null)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">No mood linked</option>
            {logs.map((log) => (
              <option key={log.id} value={log.id}>
                {MOOD_CONFIG[log.moodLevel].emoji} {formatLogTime(log.loggedAt)} · Stress {log.stressLevel}/10
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/*Actions*/}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition ${
              isSubmitting ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}