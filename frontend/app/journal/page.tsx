"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodLogger from "../../components/MoodLogger";
import MoodHistory from "../../components/MoodHistory";
import JournalEditor from "../../components/JournalEditor";
import OnboardingWizard from "../../components/OnboardingWizard";
import { MoodLog, User, TagsResponse, JournalEntry, MoodLevelConfig } from "../../../shared/types";
import { fetchMoodLogs, checkAuthStatus, fetchTags, fetchJournalEntries, logoutUser, fetchMoodConfig } from "../../../shared/api";
import PromptSection from "../../components/PromptSection";
import { Prompt } from "../../../shared/prompts";

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
  };

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
          <button onClick={() => router.push("/")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Tasks</button>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Dashboard</button>
          <button onClick={() => router.push("/journal")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid #4f46e5", backgroundColor: "#4f46e5", color: "#ffffff", cursor: "pointer" }}>Journal</button>
          <button onClick={() => router.push("/nutrition")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Nutrition</button>
          <button onClick={() => router.push("/settings")} style={{ width: 34, height: 34, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255,255,255,0.7)", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button onClick={handleLogout} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Logout</button>
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
              onTagsUpdated={(newTag) =>
                setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }))
              }
              moodConfig={moodConfig}
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
              moodLogs={logs}
              defaultMoodLogId={pendingMoodLogId}
              promptText={selectedPrompt?.text ?? null}
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
              onRefresh={loadData}
              onTagsUpdated={(newTag) =>
                setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }))
              }
            />
          </div>
        )}

      </div>
    </div>
  );
}