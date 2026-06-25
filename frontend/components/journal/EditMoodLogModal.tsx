"use client";

import { useState } from "react";
import { MoodLog, MoodLevel, StressLevel, Tag, TagsResponse, UpdateMoodLogPayload } from "../../../shared/types";
import { updateMoodLog } from "../../../shared/api";
import TagSelector from "./TagSelector";
import { useToastContext } from "../notifications/ToastContext";

const DEFAULT_MOODS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: "😢", label: "Awful" },
  { level: 2, emoji: "😕", label: "Bad"   },
  { level: 3, emoji: "😐", label: "Okay"  },
  { level: 4, emoji: "🙂", label: "Good"  },
  { level: 5, emoji: "😄", label: "Great" },
];

const STRESS_ANCHORS: Record<number, string> = {
  1: "Calm", 3: "Relaxed", 5: "Neutral", 7: "Tense", 10: "Overwhelmed",
};

interface EditMoodLogModalProps {
  log: MoodLog;
  tags: TagsResponse;
  onSaved: () => void;
  onClose: () => void;
  onCustomTagCreated: (tag: Tag) => void;
  onCustomTagDeleted: (tagId: number) => void;
}

export default function EditMoodLogModal({ log, tags, onSaved, onClose, onCustomTagCreated, onCustomTagDeleted }: EditMoodLogModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodLevel>(log.moodLevel);
  const [stressLevel, setStressLevel] = useState<StressLevel>(log.stressLevel);
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>(
    log.tags.map((t) => `${t.type}:${t.id}`)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToastContext();

  const toggleTag = (tag: Tag) => {
    const key = `${tag.type}:${tag.id}`;
    setSelectedTagKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    const systemTagIds = selectedTagKeys
        .filter((k) => k.startsWith("system:"))
        .map((k) => Number(k.split(":")[1]));

    const customTagIds = selectedTagKeys
        .filter((k) => k.startsWith("custom:"))
        .map((k) => Number(k.split(":")[1]));

    const payload: UpdateMoodLogPayload = {
      mood_level: selectedMood,
      stress_level: stressLevel,
      systemTagIds,
      customTagIds,
    };

    try {
      await updateMoodLog(log.id, payload);
      showToast("Mood entry updated");
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
      showToast("Failed to update mood. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/*Modal panel*/}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Edit Mood Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>

        {/*Mood picker*/}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mood</p>
          <div className="flex gap-2 justify-between">
            {DEFAULT_MOODS.map((mood) => (
              <button
                key={mood.level}
                onClick={() => setSelectedMood(mood.level)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 flex-1 transition-all ${
                  selectedMood === mood.level
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-[10px] font-medium text-slate-600">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/*Stress slider*/}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Stress — <span className="text-slate-700">{STRESS_ANCHORS[stressLevel] || stressLevel} ({stressLevel}/10)</span>
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={stressLevel}
            onChange={(e) => setStressLevel(Number(e.target.value) as StressLevel)}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/*Tag selector*/}
        <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tags</p>
            <TagSelector
                tags={tags}
                selectedTagKeys={selectedTagKeys}
                onToggle={toggleTag}
                onCustomTagCreated={(newTag) => {
                    onCustomTagCreated(newTag);
                    setSelectedTagKeys((prev) => [...prev, `custom:${newTag.id}`]);
                }}
                onCustomTagDeleted={(tagId) => {
                  onCustomTagDeleted(tagId);
                  setSelectedTagKeys((prev) => prev.filter((key) => key !== `custom:${tagId}`));
                }}
            />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

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