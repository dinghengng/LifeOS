"use client";

import { useState, useEffect } from "react";
import { MoodLevelConfig, EmojiPack, MoodLevel } from "../../../shared/types";
import { fetchEmojiPacks, saveMoodConfig } from "../../../shared/api";

const DEFAULT_LEVELS: Omit<MoodLevelConfig, "id">[] = [
  { level: 1, label: "Awful", emoji: "😢", color: "#ef4444", displayOrder: 0 },
  { level: 2, label: "Bad",   emoji: "😕", color: "#f97316", displayOrder: 1 },
  { level: 3, label: "Okay",  emoji: "😐", color: "#eab308", displayOrder: 2 },
  { level: 4, label: "Good",  emoji: "🙂", color: "#22c55e", displayOrder: 3 },
  { level: 5, label: "Great", emoji: "😄", color: "#6366f1", displayOrder: 4 },
];

interface Props {
  initialConfig?: MoodLevelConfig[];
  onSaved?: (saved: MoodLevelConfig[]) => void;
  saveLabel?: string;
  hideSaveButton?: boolean;
  saveRef?: React.RefObject<(() => Promise<MoodLevelConfig[] | null>) | null>;
}

export default function MoodSettingsSection({
  initialConfig,
  onSaved,
  saveLabel = "Save Changes",
  hideSaveButton = false,
  saveRef,
}: Props) {
  const [packs, setPacks] = useState<EmojiPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [levels, setLevels] = useState<Omit<MoodLevelConfig, "id">[]>(
    initialConfig
      ? initialConfig.map(({ id: _id, ...rest }) => rest)
      : DEFAULT_LEVELS
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchEmojiPacks()
      .then((data) => {
        setPacks(data);
        if (!initialConfig) {
          const def = data.find((p) => p.isDefault);
          if (def) setSelectedPackId(def.id);
        }
      })
      .catch(console.error);
  }, [initialConfig]);

  useEffect(() => {
    if (saveRef) saveRef.current = handleSave;
  });

  const applyPack = (pack: EmojiPack) => {
    setSelectedPackId(pack.id);
    setLevels((prev) =>
      prev.map((l, i) => ({ ...l, emoji: pack.emojis[i] ?? l.emoji }))
    );
  };

  const updateLevel = (index: number, field: "label" | "emoji" | "color", value: string) => {
    setLevels((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const handleSave = async (): Promise<MoodLevelConfig[] | null> => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const saved = await saveMoodConfig({
        levels: levels.map((l) => ({
          level: l.level as MoodLevel,
          label: l.label,
          emoji: l.emoji,
          color: l.color,
          display_order: l.displayOrder,
        })),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onSaved?.(saved);
      return saved;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/*Mood Packs*/}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Emoji Pack</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => applyPack(pack)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all w-full overflow-hidden ${
                selectedPackId === pack.id
                  ? "border-indigo-500 bg-indigo-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-xs font-medium text-slate-600">{pack.name}</span>
              <div className="flex gap-0.5 text-base leading-none flex-wrap justify-center w-full">
                {pack.emojis.map((em, i) => (
                  <span key={i}>{em}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Customise Each Level</h3>
        <div className="space-y-2">
          {levels.map((l, i) => (
            <div
              key={l.level}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
            >
              {/*Colour change*/}
              <label className="relative w-8 h-8 rounded-full cursor-pointer flex-shrink-0 overflow-hidden border-2 border-white shadow">
                <span className="absolute inset-0 rounded-full" style={{ background: l.color }} />
                <input
                  type="color"
                  value={l.color}
                  onChange={(e) => updateLevel(i, "color", e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>

              {/*Emoji*/}
              <input
                type="text"
                value={l.emoji}
                onChange={(e) => updateLevel(i, "emoji", e.target.value)}
                className="w-10 text-center text-xl bg-transparent border-none outline-none"
                maxLength={2}
              />

              {/*Label*/}
              <input
                type="text"
                value={l.label}
                onChange={(e) => updateLevel(i, "label", e.target.value)}
                className="flex-1 text-sm text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-400 outline-none transition"
                maxLength={20}
              />

              <span className="text-xs text-slate-400 font-mono flex-shrink-0">L{l.level}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Preview</h3>
        <div className="flex gap-2 justify-center bg-slate-50 rounded-xl p-4 border border-slate-200">
          {levels.map((l) => (
            <div key={l.level} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
                style={{ borderColor: l.color, background: `${l.color}18` }}
              >
                {l.emoji}
              </div>
              <span className="text-xs text-slate-500 text-center leading-tight max-w-14">
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/*Save*/}
      {!hideSaveButton && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : saveLabel}
          </button>
          {saveSuccess && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          {saveError && <span className="text-sm text-red-500">{saveError}</span>}
        </div>
      )}
    </div>
  );
}