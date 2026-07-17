"use client";

import { useState } from "react";
import { MoodLog, MoodLevel, StressLevel, Tag, TagsResponse, UpdateMoodLogPayload, MoodLevelConfig } from "../../../shared/types";
import { updateMoodLog } from "../../../shared/api";
import TagSelector from "./TagSelector";
import { useToastContext } from "../notifications/ToastContext";
import { useTranslation } from "../../context/LanguageContext";

const FALLBACK_MOOD_CONFIG: MoodLevelConfig[] = [
  { id: 1, level: 1, emoji: "😢", label: "Awful", color: "#ef4444", displayOrder: 0 },
  { id: 2, level: 2, emoji: "😕", label: "Bad", color: "#f97316", displayOrder: 1 },
  { id: 3, level: 3, emoji: "😐", label: "Okay", color: "#eab308", displayOrder: 2 },
  { id: 4, level: 4, emoji: "🙂", label: "Good", color: "#22c55e", displayOrder: 3 },
  { id: 5, level: 5, emoji: "😄", label: "Great", color: "#6366f1", displayOrder: 4 },
];

interface EditMoodLogModalProps {
  log: MoodLog;
  tags: TagsResponse;
  moodConfig?: MoodLevelConfig[];
  onSaved: () => void;
  onClose: () => void;
  onCustomTagCreated: (tag: Tag) => void;
  onCustomTagDeleted: (tagId: number) => void;
}

export default function EditMoodLogModal({ log, tags, moodConfig, onSaved, onClose, onCustomTagCreated, onCustomTagDeleted }: EditMoodLogModalProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<MoodLevel>(log.moodLevel);
  const [stressLevel, setStressLevel] = useState<StressLevel>(log.stressLevel);
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>(
    log.tags.map((t) => `${t.type}:${t.id}`)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToastContext();

  const STRESS_ANCHORS: Record<number, string> = {
    1: t("stress.calm"), 3: t("stress.relaxed"), 5: t("stress.neutral"), 7: t("stress.tense"), 10: t("stress.overwhelmed"),
  };

  const resolvedMoodConfig = moodConfig?.length ? moodConfig : FALLBACK_MOOD_CONFIG;

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
      showToast(t("editMoodLog.toastSuccess"));
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("editMoodLog.errorDefault"));
      showToast(t("editMoodLog.toastError"), "error");
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
          <h2 className="text-lg font-bold text-slate-800">{t("editMoodLog.title")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>

        {/*Mood picker*/}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t("editMoodLog.moodLabel")}</p>
          <div className="flex gap-2 justify-between">
            {resolvedMoodConfig.map((mood) => {
              const isSelected = selectedMood === mood.level;

              return (
                <button
                  key={mood.level}
                  onClick={() => setSelectedMood(mood.level)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 flex-1 transition-all"
                  style={{
                    borderColor: mood.color,
                    backgroundColor: isSelected ? `${mood.color}28` : `${mood.color}18`,
                    boxShadow: isSelected ? `0 0 0 3px ${mood.color}22` : "none",
                  }}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-[10px] font-medium text-slate-700">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/*Stress slider*/}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {t("editMoodLog.stressLabel")} — <span className="text-slate-700">{STRESS_ANCHORS[stressLevel] || stressLevel} ({stressLevel}/10)</span>
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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t("editMoodLog.tagsLabel")}</p>
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
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition ${
              isSubmitting ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting ? t("common.saving") : t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}