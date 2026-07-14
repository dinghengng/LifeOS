"use client";

import { useState, useEffect } from "react";
import { MoodLevelConfig, EmojiPack, MoodLevel } from "../../../shared/types";
import { fetchEmojiPacks, saveMoodConfig } from "../../../shared/api";
import { useToastContext } from "../notifications/ToastContext";
import SettingsSectionCard from "./SettingsSectionCard";
import SettingsActionFooter from "./SettingsActionFooter";

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
  // const [saveSuccess, setSaveSuccess] = useState(false);
  const { showToast } = useToastContext();

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
    // setSaveSuccess(false);
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
      // setSaveSuccess(true);
      // setTimeout(() => setSaveSuccess(false), 2000);
      showToast("Mood settings updated");
      onSaved?.(saved);
      return saved;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      showToast("Failed to save mood settings.", "error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/*Mood Packs*/}
      <SettingsSectionCard title="Emoji pack">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => applyPack(pack)}
              className={`flex w-full flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-3 text-center transition-all ${
                selectedPackId === pack.id
                  ? "border-indigo-500 bg-indigo-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-xs font-medium text-slate-600">{pack.name}</span>
              <div className="flex w-full flex-wrap justify-center gap-0.5 text-base leading-none">
                {pack.emojis.map((em, i) => <span key={i}>{em}</span>)}
              </div>
            </button>
          ))}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Customise each level">
        <div className="space-y-2">
          {levels.map((l, i) => (
            <div
              key={l.level}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              {/*Colour change*/}
              <label className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow">
                <span className="absolute inset-0 rounded-full" style={{ background: l.color }} />
                <input
                  type="color"
                  value={l.color}
                  onChange={(e) => updateLevel(i, "color", e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>

              {/*Emoji*/}
              <input
                type="text"
                value={l.emoji}
                onChange={(e) => updateLevel(i, "emoji", e.target.value)}
                className="w-10 border-none bg-transparent text-center text-xl outline-none"
                maxLength={2}
              />

              {/*Label*/}
              <input
                type="text"
                value={l.label}
                onChange={(e) => updateLevel(i, "label", e.target.value)}
                className="flex-1 border-b border-transparent bg-transparent text-sm text-slate-700 outline-none transition focus:border-indigo-400"
                maxLength={20}
              />
              <span className="flex-shrink-0 font-mono text-xs text-slate-400">L{l.level}</span>
            </div>
          ))}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Preview">
        <div className="flex justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {levels.map((l) => (
            <div key={l.level} className="flex flex-col items-center gap-1">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl"
                style={{ borderColor: l.color, background: `${l.color}18` }}
              >
                {l.emoji}
              </div>
              <span className="max-w-14 text-center text-xs leading-tight text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      </SettingsSectionCard>

      {/*Save*/}
      <SettingsActionFooter onSave={handleSave} saving={saving} label={saveLabel} error={saveError} hidden={hideSaveButton} />
    </div>
  );
}