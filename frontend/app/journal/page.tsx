"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodLogger from "../../components/journal/MoodLogger";
import MoodHistory from "../../components/journal/MoodHistory";
import JournalEditor from "../../components/journal/JournalEditor";
import OnboardingWizard from "../../components/OnboardingWizard";
import { MoodLog, User, TagsResponse, JournalEntry, MoodLevelConfig, Tag } from "../../../shared/types";
import { fetchMoodLogs, checkAuthStatus, fetchTags, fetchJournalEntries, logoutUser, fetchMoodConfig } from "../../../shared/api";
import PromptSection from "../../components/journal/PromptSection";
import { Prompt } from "../../../shared/prompts";
import Navbar from "../../components/Navbar";

type Tab = "mood" | "write" | "history"; 

export default function JournalPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [tags, setTags] = useState<TagsResponse>({ system: [], custom: [] });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("mood"); 
  const [pendingMoodLogId, setPendingMoodLogId] = useState<number | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptJumpToken, setPromptJumpToken] = useState(0);
  const [moodConfig, setMoodConfig] = useState<MoodLevelConfig[]>([]);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);

      // show wizard on first login
      const moodConfig = await fetchMoodConfig();
      if (moodConfig.length === 0) setShowOnboarding(true);
      else setMoodConfig(moodConfig);

      await loadData();
      setLoading(false);
    };
    init();
  }, [router]);

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

  const handleMoodSaved = async (newLogId: number) => {
    await loadData();
    setActiveTab("history");
  };

  const handleJournalSaved = async () => {
    setPendingMoodLogId(null);
    await loadData();
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch (err) { console.error(err); }
    router.push("/");
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setActiveTab("write");
    setPromptJumpToken((n) => n + 1);
  };

  const handleCustomTagCreated = (newTag: Tag) => {
    setTags((prev) => ({
      ...prev,
      custom: [...prev.custom, newTag],
    }));
  };

  const handleCustomTagDeleted = (tagId: number) => {
    setTags((prev) => ({
      ...prev,
      custom: prev.custom.filter((tag) => tag.id !== tagId),
    }));
  };

  const usedMoodLogIds = new Set(
    entries
      .filter((entry) => entry.moodLogId !== null)
      .map((entry) => entry.moodLogId as number)
  );

  const availableMoodLogs = logs.filter(
    (log) => !usedMoodLogIds.has(log.id) || log.id === pendingMoodLogId
  );

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary, #f5f5f2)", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary, #f5f5f2)", fontFamily: "var(--font-sans)", padding: "2rem" }}>
      
      {/*Wizard shown on first login*/}
      {showOnboarding && user && (
        <OnboardingWizard
          userName={user.name}
          onComplete={async () => {
            setShowOnboarding(false);
            const config = await fetchMoodConfig();
            setMoodConfig(config);
            loadData();
      }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{today}</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>
            Life Journal
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Navbar onLogout={handleLogout} />
        </div>
      </div>

      <div style={{ maxWidth: "48rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/*Tabs*/}
        <div className="w-full mb-6">
          <div className="flex gap-1 bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow p-1.5">
            {(["mood", "write", "history"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition capitalize ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab === "mood" && "Mood"}
                {tab === "write" && "Write"}
                {tab === "history" && "History"}
              </button>
            ))}
          </div>
        </div>

        {/*Mood*/}
        {activeTab === "mood" && (
          <div className="w-full">
            <MoodLogger
              onSaved={handleMoodSaved}
              tags={tags}
              onCustomTagCreated={handleCustomTagCreated}
              onCustomTagDeleted={handleCustomTagDeleted}
              moodConfig={moodConfig}
              userName = {user?.name}
            />
          </div>
        )}

        {/*Write*/}
        {activeTab === "write" && (
          <div className="w-full flex flex-col gap-0">
            <PromptSection onSelectPrompt={handleSelectPrompt} />
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
              defaultMoodLogId={pendingMoodLogId}
              promptText={selectedPrompt?.text ?? null}
              jumpToEditorToken={promptJumpToken}
            />
          </div>
        )}

        {/*History*/}
        {activeTab === "history" && (
          <div className="w-full">
            <MoodHistory
              logs={logs}
              tags={tags}
              entries={entries}
              moodConfig={moodConfig}
              onRefresh={loadData}
              onCustomTagCreated={handleCustomTagCreated}
              onCustomTagDeleted={handleCustomTagDeleted}
            />
          </div>
        )}

      </div>
    </div>
  );
}