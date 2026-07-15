"use client";

import { useState, useEffect } from "react";
import { Tag, TagsResponse, MoodLevel, StressLevel, CreateMoodLogPayload, } from "../../../shared/types";
import { createMoodLog } from "../../../shared/api";
import { MoodLevelConfig } from "../../../shared/types";
import TagSelector from "./TagSelector";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useToastContext } from "../notifications/ToastContext";

// Default mood config
// const DEFAULT_MOODS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
//   { level: 1, emoji: "😢", label: "Awful",   color: "#ef4444" },
//   { level: 2, emoji: "😕", label: "Bad",     color: "#f97316" },
//   { level: 3, emoji: "😐", label: "Okay",    color: "#eab308" },
//   { level: 4, emoji: "🙂", label: "Good",    color: "#22c55e" },
//   { level: 5, emoji: "😄", label: "Great",   color: "#6366f1" },
// ];

// Stress slider labels at all positions
const STRESS_ANCHORS: Record<number, string> = {
  1: "Calm",
  2: "Calm",
  3: "Relaxed",
  4: "Relaxed",
  5: "Neutral",
  6: "Neutral",
  7: "Tense",
  8: "Tense",
  9: "Overwhelmed",
  10: "Overwhelmed",
};

interface MoodLoggerProps {
  onSaved: (newLogId: number) => void;
  tags: TagsResponse;
  onCustomTagCreated: (tag: Tag) => void; 
  onCustomTagDeleted: (tagId: number) => void;
  moodConfig: MoodLevelConfig[];
  userName?: string | null;
}

export default function MoodLogger({ onSaved, tags, onCustomTagCreated, onCustomTagDeleted, moodConfig, userName, }: MoodLoggerProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); //1=mood, 2=stress, 3=tags
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [stressLevel, setStressLevel] = useState<StressLevel>(5);
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const { showToast } = useToastContext();
  const greetingName = userName?.trim() || "you"; //user name defaults to "you"

  const noteEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        listItem: {},
      }),
      Placeholder.configure({ placeholder: "How are you feeling right now?" }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-slate-800",
      },
    },
    onUpdate: () => forceUpdate((n) => n + 1),
    onSelectionUpdate: () => forceUpdate((n) => n + 1),
  });

  const toggleTag = (tag: Tag) => {
    const key = `${tag.type}:${tag.id}`
    setSelectedTagKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!selectedMood) return;
    setIsSubmitting(true);
    setError(null);

    // Split selected tag ids into system vs custom
    const systemTagIds = selectedTagKeys
        .filter((k) => k.startsWith("system:"))
        .map((k) => Number(k.split(":")[1]));

    const customTagIds = selectedTagKeys
        .filter((k) => k.startsWith("custom:"))
        .map((k) => Number(k.split(":")[1]));

    const noteText = noteEditor?.getText().trim();

    const payload: CreateMoodLogPayload = {
      mood_level: selectedMood,
      stress_level: stressLevel,
      systemTagIds,
      customTagIds,
      note: noteText ? noteText : undefined,
    };
    
    try {
      const newLog = await createMoodLog(payload);
      setStep(1);
      setSelectedMood(null);
      setStressLevel(5);
      setSelectedTagKeys([]);
      noteEditor?.commands.clearContent();
      onSaved(newLog.id);
      showToast("Mood logged");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save mood log.");
      showToast("Failed to save mood. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5">
      {/*Headers for each step*/}
      <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">
        {step === 1 && `Hey, ${greetingName}. How are you today?`}
        {step === 2 && "How stressed do you feel?"}
        {step === 3 && "What's been on your mind? (optional)"}
        {step === 4 && "Add a quick note (optional)"}
      </h2>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
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
          <div className="flex gap-3 justify-center flex-wrap">
            {moodConfig.map((mood) => {
              const isSelected = selectedMood === mood.level;

              return (
                <button
                  key={mood.level}
                  onClick={() => {
                    setSelectedMood(mood.level as MoodLevel);
                    setStep(2);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-105"
                  style={{
                    borderColor: mood.color,
                    backgroundColor: isSelected ? `${mood.color}28` : `${mood.color}18`,
                    boxShadow: isSelected ? `0 0 0 3px ${mood.color}22` : "none",
                  }}
                >
                  <span className="text-4xl leading-none">{mood.emoji}</span>
                  <span className="text-xs font-medium text-slate-700">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/*STEP 2: STRESS SLIDER*/}
      {step === 2 && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-slate-400 mb-1 px-1">
              <span>Calm</span>
              <span>Relaxed</span>
              <span>Neutral</span>
              <span>Tense</span>
              <span>Overwhelmed</span>
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
                    onClick={() => setStep(4)} 
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                >
                    Continue
                </button>
            </div>
          </div>
        )}

      {/*STEP 4: OPTIONAL NOTE*/}
      {step === 4 && (
        <div className="flex flex-col gap-4 w-full">

          {noteEditor && (
            <div className="flex gap-1 px-1 flex-wrap">
              {[
                {
                  label: <span className="font-bold">B</span>,
                  action: () => noteEditor.chain().focus().toggleBold().run(),
                  format: "bold",
                },
                {
                  label: <span className="italic">I</span>,
                  action: () => noteEditor.chain().focus().toggleItalic().run(),
                  format: "italic",
                },
                {
                  label: <span className="line-through">S</span>,
                  action: () => noteEditor.chain().focus().toggleStrike().run(),
                  format: "strike",
                },
                {
                  label: <span className="font-bold text-[11px]">H1</span>,
                  action: () => noteEditor.chain().focus().toggleHeading({ level: 1 }).run(),
                  format: "heading", formatAttrs: { level: 1 },
                },
                {
                  label: <span className="font-bold text-[11px]">H2</span>,
                  action: () => noteEditor.chain().focus().toggleHeading({ level: 2 }).run(),
                  format: "heading", formatAttrs: { level: 2 },
                },
                {
                  label: <span className="font-bold text-[11px]">H3</span>,
                  action: () => noteEditor.chain().focus().toggleHeading({ level: 3 }).run(),
                  format: "heading", formatAttrs: { level: 3 },
                },
                {
                  label: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="3" cy="6" r="2"/><rect x="7" y="5" width="14" height="2" rx="1"/>
                      <circle cx="3" cy="12" r="2"/><rect x="7" y="11" width="14" height="2" rx="1"/>
                      <circle cx="3" cy="18" r="2"/><rect x="7" y="17" width="14" height="2" rx="1"/>
                    </svg>
                  ),
                  action: () => noteEditor.chain().focus().toggleBulletList().run(),
                  format: "bulletList",
                },
                {
                  label: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <text x="1" y="7" fontSize="7" fontWeight="bold">1.</text>
                      <rect x="7" y="5" width="14" height="2" rx="1"/>
                      <text x="1" y="13" fontSize="7" fontWeight="bold">2.</text>
                      <rect x="7" y="11" width="14" height="2" rx="1"/>
                      <text x="1" y="19" fontSize="7" fontWeight="bold">3.</text>
                      <rect x="7" y="17" width="14" height="2" rx="1"/>
                    </svg>
                  ),
                  action: () => noteEditor.chain().focus().toggleOrderedList().run(),
                  format: "orderedList",
                },
              ].map(({ label, action, format, formatAttrs }) => (
                <button
                  key={format + ((formatAttrs as { level?: number })?.level ?? "")}
                  onMouseDown={(e) => { e.preventDefault(); action(); }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition ${
                    noteEditor.isActive(format, formatAttrs)
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                    {label}
                </button>
              ))}
            </div>
          )}

          <div className="w-full rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300 transition">
            <EditorContent editor={noteEditor} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition ${
                isSubmitting ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}