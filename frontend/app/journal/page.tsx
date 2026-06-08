"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodLogger from "../../components/MoodLogger";
import MoodHistory from "../../components/MoodHistory";
import JournalEditor from "../../components/JournalEditor";
import { MoodLog, User, TagsResponse, JournalEntry } from "../../../shared/types";
import { fetchMoodLogs, checkAuthStatus, fetchTags, fetchJournalEntries } from "../../../shared/api";


type Tab = "mood" | "write" | "history"; //3 separate tabs


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
  }, []);


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
    setPendingMoodLogId(newLogId);
    setActiveTab("write");
  };

  const handleJournalSaved = async () => {
    setPendingMoodLogId(null);
    await loadData();
  };


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 px-2">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-slate-500 hover:text-slate-800 transition"
        >
          ← Back to Tasks
        </button>
        <span className="text-white/90 text-sm font-medium bg-slate-800 px-3 py-1 rounded-full">
          {user?.name || user?.email}
        </span>
      </div>


      {/*Title*/}
      <div className="w-full max-w-3xl mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Journal</h1>
        <p className="text-slate-500 text-sm mt-1">Track your mood and reflect on your day</p>
      </div>


      {/*Tabs*/}
      <div className="w-full max-w-3xl mb-6">
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


      {/*Mood tab*/}
      {activeTab === "mood" && (
        <MoodLogger
          onSaved={handleMoodSaved}
          tags={tags}
          onTagsUpdated={(newTag) =>
            setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }))
          }
        />
      )}


      {/*Write tab*/}
      {activeTab === "write" && (
        <div className="w-full max-w-3xl">
          {pendingMoodLogId && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-indigo-700">
              <span>What's making you feel this way?</span>
              <button
                onClick={() => setPendingMoodLogId(null)}
                className="text-indigo-400 hover:text-indigo-600 transition text-xs"
              >
                Unlink
              </button>
            </div>
          )}
          <JournalEditor
            onSaved={handleJournalSaved}
            onCancel={() => setPendingMoodLogId(null)}
            moodLogs={logs}
            defaultMoodLogId={pendingMoodLogId}
          />
        </div>
      )}


      {/*History tab*/}
      {activeTab === "history" && (
        <MoodHistory
          logs={logs}
          tags={tags}
          entries={entries}
          onRefresh={loadData}
          onTagsUpdated={(newTag) =>
            setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }))
          }
        />
      )}

    </main>
  );
}