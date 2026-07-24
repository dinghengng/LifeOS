"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodLogger from "../../components/journal/MoodLogger";
import MoodHistory from "../../components/journal/MoodHistory";
import JournalEditor from "../../components/journal/JournalEditor";
import PromptSection from "../../components/journal/PromptSection";
import { MoodScienceCard, MoodLinkTip } from "../../components/journal/MoodInsightPanel";
import OnboardingWizard from "../../components/OnboardingWizard";
import { MoodLog, TagsResponse, JournalEntry, MoodLevelConfig, Tag } from "../../../shared/types";
import { fetchMoodLogs, fetchTags, fetchJournalEntries, fetchMoodConfig } from "../../../shared/api";
import { Prompt } from "../../../shared/prompts";

import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";
import LocalTabs from "../../components/layout/LocalTabs";
import { useTranslation } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext"; 
type Tab = "mood" | "write" | "history";

export default function JournalPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [tags, setTags] = useState<TagsResponse>({ system: [], custom: [] });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("mood");
  const [pendingMoodLogId, setPendingMoodLogId] = useState<number | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptJumpToken, setPromptJumpToken] = useState(0);
  const [moodConfig, setMoodConfig] = useState<MoodLevelConfig[]>([]);

  const JOURNAL_TABS: { id: Tab; label: string }[] = [
    { id: "mood", label: t("journal.tabs.mood") },
    { id: "write", label: t("journal.tabs.write") },
    { id: "history", label: t("journal.tabs.history") },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Load mood-config + data once we actually have an authenticated user
  useEffect(() => {
    if (authLoading || !user) return;

    const init = async () => {
      setDataLoading(true);
      const config = await fetchMoodConfig();
      if (config.length === 0) setShowOnboarding(true);
      else setMoodConfig(config);

      await loadData();
      setDataLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      const [data, tagData, journalData] = await Promise.all([
        fetchMoodLogs(), fetchTags(), fetchJournalEntries(),
      ]);
      setLogs(data);
      setTags(tagData);
      setEntries(journalData);
    } catch (err) {
      console.error("Failed to load:", err);
    }
  };

  const handleMoodSaved = async () => {
    await loadData();
    setActiveTab("history");
  };

  const handleJournalSaved = async () => {
    setPendingMoodLogId(null);
    await loadData();
  };


  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setActiveTab("write");
    setPromptJumpToken((n) => n + 1);
  };

  const handleCustomTagCreated = (newTag: Tag) => {
    setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }));
  };

  const handleCustomTagDeleted = (tagId: number) => {
    setTags((prev) => ({ ...prev, custom: prev.custom.filter((t) => t.id !== tagId) }));
  };

  const usedMoodLogIds = new Set(
    entries.filter((e) => e.moodLogId !== null).map((e) => e.moodLogId as number)
  );
  const availableMoodLogs = logs.filter(
    (log) => !usedMoodLogIds.has(log.id) || log.id === pendingMoodLogId
  );

  if (authLoading || !user || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">{t("journal.loading")}</p>
      </div>
    );
  }

  return (
    <AppShell>
      <AppHeader
        rightActions={
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            {t("common.logout")}
          </button>
        }
      />

      {showOnboarding && user && (
        <OnboardingWizard
          onComplete={async () => {
            setShowOnboarding(false);
            const config = await fetchMoodConfig();
            setMoodConfig(config);
            loadData();
          }}
        />
      )}

      <PageHeader
        eyebrow={new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-SG", { weekday: "long", day: "numeric", month: "long" })}
        title={t("journal.title")}
        description={t("journal.description")}
      />

      <LocalTabs
        items={JOURNAL_TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
      />

      {/* Mood tab: single pill card, MoodLogger handles its own internal step layout */}
      {activeTab === "mood" && (
        <MoodLogger
          onSaved={handleMoodSaved}
          tags={tags}
          onCustomTagCreated={handleCustomTagCreated}
          onCustomTagDeleted={handleCustomTagDeleted}
          moodConfig={moodConfig}
          userName={user?.name}
        />
      )}

      {activeTab === "write" && (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <JournalEditor
              onSaved={() => {
                setSelectedPrompt(null);
                handleJournalSaved();
              }}
              onCancel={() => {
                setSelectedPrompt(null);
                setPendingMoodLogId(null);
              }}
              moodLogs={availableMoodLogs}
              moodConfig={moodConfig}
              defaultMoodLogId={pendingMoodLogId}
              promptText={selectedPrompt?.text ?? null}
              jumpToEditorToken={promptJumpToken}
            />
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <PromptSection onSelectPrompt={handleSelectPrompt} />
          </section>
        </div>
      )}

      {activeTab === "history" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <MoodHistory
              logs={logs}
              tags={tags}
              entries={entries}
              moodConfig={moodConfig}
              onRefresh={loadData}
              onCustomTagCreated={handleCustomTagCreated}
              onCustomTagDeleted={handleCustomTagDeleted}
            />
          </section>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <MoodScienceCard />
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <MoodLinkTip />
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}