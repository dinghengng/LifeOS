"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodLogger from "../../components/MoodLogger";
import MoodHistory from "../../components/MoodHistory";
import JournalEditor from "../../components/JournalEditor";
import { MoodLog, User, TagsResponse, JournalEntry } from "../../../shared/types";
import { fetchMoodLogs, checkAuthStatus, fetchTags, fetchJournalEntries, logoutUser } from "../../../shared/api";

type Tab = "mood" | "write" | "history"; 

export default function JournalPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [tags, setTags] = useState<TagsResponse>({ system: [], custom: [] });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("mood"); 
  const [pendingMoodLogId, setPendingMoodLogId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
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
      
      {/* changed to be consistent Title on the Left, Navigation on the Right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{today}</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>
            Life Journal
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => router.push("/")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Tasks</button>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Dashboard</button>
          <button onClick={() => router.push("/journal")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid #4f46e5", backgroundColor: "#4f46e5", color: "#ffffff", cursor: "pointer" }}>Journal</button>
          <button onClick={() => router.push("/nutrition")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Nutrition</button>
          <button onClick={handleLogout} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT: Centered in the middle of the screen */}
      <div style={{ maxWidth: "48rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Tabs */}
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

        {/* Mood tab */}
        {activeTab === "mood" && (
          <div className="w-full">
            <MoodLogger
              onSaved={handleMoodSaved}
              tags={tags}
              onTagsUpdated={(newTag) =>
                setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }))
              }
            />
          </div>
        )}

        {/* Write tab */}
        {activeTab === "write" && (
          <div className="w-full">
            <JournalEditor
              onSaved={handleJournalSaved}
              onCancel={() => setPendingMoodLogId(null)}
              moodLogs={logs}
              defaultMoodLogId={pendingMoodLogId}
            />
          </div>
        )}

        {/* History tab */}
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