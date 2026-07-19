import { Sparkles } from "lucide-react";
import type { JournalEntry } from "../../../shared/types";

const MOOD_EMOJI: Record<number, string> = {
  1: "😞", 2: "🙁", 3: "😐", 4: "🙂", 5: "😄",
  6: "🙂", 7: "🙂", 8: "😊", 9: "😄", 10: "🤩",
};

export default function AIThemeChips({ entry }: { entry: JournalEntry }) {
  if (!entry.aiAnalyzedAt || !entry.aiThemes || entry.aiThemes.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <Sparkles size={11} className="text-indigo-400 shrink-0" />
      {entry.aiMoodScore !== null && (
        <span className="text-xs">{MOOD_EMOJI[entry.aiMoodScore] ?? "🙂"}</span>
      )}
      {entry.aiThemes.map((theme) => (
        <span
          key={theme}
          className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100"
        >
          {theme}
        </span>
      ))}
    </div>
  );
}