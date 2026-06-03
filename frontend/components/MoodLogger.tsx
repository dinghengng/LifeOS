"use client";

import { useState, useEffect } from "react";
import { Tag, TagsResponse, MoodLevel, StressLevel, CreateMoodLogPayload } from "../../shared/types";
import { fetchTags, createMoodLog } from "../../shared/api";

// Default mood config
const DEFAULT_MOODS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 1, emoji: "😢", label: "Awful",   color: "#ef4444" },
  { level: 2, emoji: "😕", label: "Bad",     color: "#f97316" },
  { level: 3, emoji: "😐", label: "Okay",    color: "#eab308" },
  { level: 4, emoji: "🙂", label: "Good",    color: "#22c55e" },
  { level: 5, emoji: "😄", label: "Great",   color: "#6366f1" },
];

// Stress slider labels at positions 1, 3, 5, 7, 10
const STRESS_ANCHORS: Record<number, string> = {
  1: "Calm",
  3: "Relaxed",
  5: "Neutral",
  7: "Tense",
  10: "Overwhelmed",
};

interface MoodLoggerProps {
  onSaved: () => void;
}

export default function MoodLogger({ onSaved }: MoodLoggerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); //1=mood, 2=stress, 3=tags
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [stressLevel, setStressLevel] = useState<StressLevel>(5);
  const [tags, setTags] = useState<TagsResponse>({ system: [], custom: [] });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags().then(setTags).catch(console.error);
  }, []);

  const toggleTag = (tag: Tag) => {
    setSelectedTagIds((prev) =>
      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
    );
  };

  const handleSave = async () => {
    if (!selectedMood) return;
    setIsSubmitting(true);
    setError(null);

    // Split selected tag ids into system vs custom
    const allTags = [...tags.system, ...tags.custom];
    const systemTagIds = selectedTagIds.filter(
      (id) => allTags.find((t) => t.id === id)?.type === "system"
    );
    const customTagIds = selectedTagIds.filter(
      (id) => allTags.find((t) => t.id === id)?.type === "custom"
    );

    const payload: CreateMoodLogPayload = {
      mood_level: selectedMood,
      stress_level: stressLevel,
      systemTagIds,
      customTagIds,
    };

    try {
      await createMoodLog(payload);
      setStep(1);
      setSelectedMood(null);
      setStressLevel(5);
      setSelectedTagIds([]);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save mood log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 w-full max-w-3xl">
      <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">How are you feeling?</h2>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-10 rounded-full transition-all ${
              s <= step ? "bg-indigo-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/*STEP 1: MOOD SELECTION*/}
      {step === 1 && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500">Select your mood</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {DEFAULT_MOODS.map((mood) => (
              <button
                key={mood.level}
                onClick={() => { setSelectedMood(mood.level); setStep(2); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all hover:scale-105 ${
                  selectedMood === mood.level
                    ? "border-indigo-500 bg-indigo-50 scale-105"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-xs font-medium text-slate-600">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/*STEP 2: STRESS SLIDER*/}
      {step === 2 && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm text-slate-500">How stressed do you feel?</p>
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-slate-400 mb-1 px-1">
              {Object.entries(STRESS_ANCHORS).map(([pos, label]) => (
                <span key={pos}>{label}</span>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value) as StressLevel)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-center mt-2 text-sm font-semibold text-slate-700">
              {STRESS_ANCHORS[stressLevel] || stressLevel}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/*STEP 3: TAG SELECTION*/}
      {step === 3 && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500">What's been on your mind? (optional)</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {tags.system.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition ${
                isSubmitting
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}