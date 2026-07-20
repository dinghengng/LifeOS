"use client";

import { useState } from "react";
import { MoodLog, MoodLevel, TagsResponse, Tag, JournalEntry, MoodLevelConfig } from "../../../shared/types";
import { deleteMoodLog, updateJournalEntry, deleteJournalEntry, } from "../../../shared/api";
import EditMoodLogModal from "./EditMoodLogModal";
import EditJournalEntryModal from "./EditJournalEntryModal";
import JournalEditor from "./JournalEditor";
import { systemTagLabel } from "./TagSelector";
import AIThemeChips from "../insights/AIThemeChips";
import { useTranslation } from "../../context/LanguageContext";
import type { TranslationKey } from "../../context/translations";

const STRESS_KEYS: Record<number, TranslationKey> = {
  1: "stress.calm", 2: "stress.calm", 3: "stress.relaxed", 4: "stress.relaxed", 5: "stress.neutral",
  6: "stress.neutral", 7: "stress.tense", 8: "stress.tense", 9: "stress.overwhelmed", 10: "stress.overwhelmed",
};

const MOOD_KEYS: Record<number, TranslationKey> = {
  1: "mood.awful", 2: "mood.bad", 3: "mood.okay", 4: "mood.good", 5: "mood.great",
};

function formatLogTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function deriveTitle(entry: JournalEntry, t: any): string {
  if (entry.title?.trim())        return entry.title.trim();
  if (entry.promptUsed?.trim())   return entry.promptUsed.trim();
  if (entry.moodLevel) {
    const label = t(MOOD_KEYS[entry.moodLevel]);
    return t("moodHistory.felt").replace("{mood}", label);
  }
  const text = stripHtml(entry.content ?? "").trim();
  if (text)                       return text.slice(0, 60) + (text.length > 60 ? "…" : "");
  return t("moodHistory.untitled");
}

function getMoodDisplay(
  level: MoodLevel,
  t: any,
  moodConfig?: MoodLevelConfig[]
): { emoji: string; label: string; color: string } {
  const cfg = moodConfig?.find((m) => m.level === level);
  const labelKey = MOOD_KEYS[level];

  return {
    emoji: cfg?.emoji ?? "🙂",
    label: labelKey ? t(labelKey) : cfg?.label ?? t("moodHistory.defaultMood"),
    color: cfg?.color ?? "#6366f1",
  };
}

interface MoodHistoryProps {
  logs: MoodLog[];
  tags: TagsResponse;
  entries?: JournalEntry[];
  moodConfig?: MoodLevelConfig[];  
  onRefresh: () => void;
  onCustomTagCreated: (tag: Tag) => void;
  onCustomTagDeleted: (tagId: number) => void;
}

function LinkToMoodButton({ entry, logs, moodConfig, onLinked }: {
  entry: JournalEntry;
  logs: MoodLog[];
  moodConfig?: MoodLevelConfig[];
  onLinked: () => void;
}) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  
  const currentLocale = locale === "zh" ? "zh-CN" : "en-SG";

  const handleLink = async (logId: number) => {
    setLinking(true);
    try {
      await updateJournalEntry(entry.id, { mood_log_id: logId });
      onLinked();
    } catch {
      //silently fail
    } finally {
      setLinking(false);
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
      >
        {t("moodHistory.linkMood")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        autoFocus
        disabled={linking}
        onChange={(e) => e.target.value && handleLink(Number(e.target.value))}
        className="text-xs border border-indigo-300 rounded-lg px-2 py-1 bg-white text-slate-600 max-w-40"
      >
        <option value="">{t("moodHistory.selectMood")}</option>
        {logs.map((log) => {
          const mood = getMoodDisplay(log.moodLevel, t, moodConfig);
          return (
            <option key={log.id} value={log.id}>
              {mood.emoji} {formatLogTime(log.loggedAt, currentLocale)}
            </option>
          );
        })}
      </select>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-slate-400 hover:text-slate-600 transition whitespace-nowrap"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}


export default function MoodHistory({ logs, tags, entries, moodConfig, onRefresh, onCustomTagCreated, onCustomTagDeleted }: MoodHistoryProps) {
  const { t, locale } = useTranslation();
  const [editingLog, setEditingLog] = useState<MoodLog | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "log" | "entry"; id: number } | null>(null);

  const currentLocale = locale === "zh" ? "zh-CN" : "en-SG";

  const entryByMoodLog = new Map<number, JournalEntry>();
  for (const entry of entries ?? []) {
    if (entry.moodLogId !== null) {
      entryByMoodLog.set(entry.moodLogId, entry);
    }
  }

  const linkedMoodLogIds = new Set(
    (entries ?? [])
      .filter((e) => e.moodLogId !== null)
      .map((e) => e.moodLogId as number)
  );

  const requestDelete = (type: "log" | "entry", id: number) => {
    setConfirmAction({ type, id });
  };

  const confirmDelete = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    setError(null);

    if (type === "log") {
      setDeletingId(id);
      try {
        await deleteMoodLog(id);
        onRefresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t("moodHistory.errorDelete"));
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingEntryId(id);
      try {
        await deleteJournalEntry(id);
        onRefresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t("moodHistory.errorDelete"));
      } finally {
        setDeletingEntryId(null);
      }
    }
    setConfirmAction(null);
  };

  const unlinkedEntries = (entries ?? []).filter((e) => e.moodLogId === null);

  if (logs.length === 0 && unlinkedEntries.length === 0) {
    return (
      <p className="text-slate-500 text-center mt-6 italic">
        {t("moodHistory.noEntries")}
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
          moodConfig={moodConfig}
          onSaved={onRefresh}
          onClose={() => setEditingLog(null)}
          onCustomTagCreated={onCustomTagCreated}
          onCustomTagDeleted={onCustomTagDeleted}
        />
      )}

      {/*journal Edit modal*/}
      {editingEntry && (
        <EditJournalEntryModal
          entry={editingEntry}
          logs={logs.filter((log) => log.id === editingEntry.moodLogId || !linkedMoodLogIds.has(log.id))}
          onSaved={onRefresh}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {/*Delete confirmation changed to in app*/}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5">
            <p className="text-sm text-slate-700 mb-4">
              {confirmAction.type === "log"
                ? t("moodHistory.confirmDeleteMood")
                : t("moodHistory.confirmDeleteEntry")}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mt-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t("moodHistory.recentEntries")}</h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <ul className="space-y-3">
          {logs.map((log) => {
            const mood = getMoodDisplay(log.moodLevel, t, moodConfig);
            const linkedEntry = entryByMoodLog.get(log.id);
            const stressLabel = t(STRESS_KEYS[log.stressLevel]);
            
            return (
              <li
                key={log.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow overflow-hidden"
              >
                {/*Mood log row*/}
                <div className="p-4 flex items-start gap-4">
                  {/*Mood emoji*/}
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-15"
                    style={{
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}18`,
                      color: mood.color,
                    }}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs font-semibold mt-0.5">{mood.label}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 mb-0.5">
                      {linkedEntry ? deriveTitle(linkedEntry, t) : t("moodHistory.felt").replace("{mood}", mood.label)}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">{formatLogTime(log.loggedAt, currentLocale)}</span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {t("moodHistory.stressLabel").replace("{level}", stressLabel).replace("{score}", String(log.stressLevel))}
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
                            {systemTagLabel(tag, t)}
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
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => requestDelete("log", log.id)}
                      disabled={deletingId === log.id}
                      className={`text-xs px-3 py-1 rounded-lg border transition ${
                        deletingId === log.id
                          ? "border-slate-200 text-slate-400 cursor-not-allowed"
                          : "border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      }`}
                    >
                      {deletingId === log.id ? "..." : t("common.delete")}
                    </button>
                  </div>
                </div>

                {/*Journal*/}
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60">
                  {linkedEntry ? (
                    <>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {stripHtml(linkedEntry.content ?? "") || t("moodHistory.noJournalText")}
                      </p>
                      <AIThemeChips entry={linkedEntry} />
                    </>
                  ) : log.note ? (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                      {stripHtml(log.note)}
                    </p>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <JournalEditor
                        compact
                        moodConfig={moodConfig}
                        defaultMoodLogId={log.id}
                        onSaved={() => {
                          onRefresh();
                        }}
                        onCancel={() => {}}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          {/*Unlinked journal entries*/}
          {unlinkedEntries.map((entry) => (
              <li
                key={`entry-${entry.id}`}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow overflow-hidden"
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-15">
                    <span className="text-2xl">📝</span>
                    <span className="text-xs font-semibold mt-0.5 text-slate-500">{t("moodHistory.note")}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 mb-0.5">
                      {deriveTitle(entry, t)}
                    </p>
                    <span className="text-xs text-slate-400">{formatLogTime(entry.createdAt, currentLocale)}</span>
                    {stripHtml(entry.content ?? "") && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {stripHtml(entry.content ?? "").slice(0, 120)}
                      </p>
                    )}
                    <AIThemeChips entry={entry} />
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => requestDelete("entry", entry.id)}
                      disabled={deletingEntryId === entry.id}
                      className={`text-xs px-3 py-1 rounded-lg border transition ${
                        deletingEntryId === entry.id
                          ? "border-slate-200 text-slate-400 cursor-not-allowed"
                          : "border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      }`}
                    >
                      {deletingEntryId === entry.id ? "..." : t("common.delete")}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60 flex justify-between items-center">
                  {entry.moodLogId === null && (
                    <LinkToMoodButton entry={entry} logs={logs.filter((log) => !linkedMoodLogIds.has(log.id))} moodConfig={moodConfig} onLinked={onRefresh}/>
                  )}
                </div>
              </li>
            ))
          }
        </ul>
      </div>
    </>
  );
}