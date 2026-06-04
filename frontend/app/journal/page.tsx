"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodLogger from "../../components/MoodLogger";
import MoodHistory from "../../components/MoodHistory";
import JournalEditor from "../../components/JournalEditor";
import JournalEntryList from "../../components/JournalEntryList";
import { MoodLog, User, TagsResponse, JournalEntry, } from "../../../shared/types";
import { fetchMoodLogs, checkAuthStatus, fetchTags, fetchJournalEntries, } from "../../../shared/api";


export default function JournalPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [tags, setTags] = useState<TagsResponse>({ system: [], custom: [] });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      await loadLogs();
      setLoading(false);
    };
    init();
  }, []);

  const loadLogs = async () => {
    try {
        const [data, tagData, journalData] = await Promise.all([fetchMoodLogs(), fetchTags(), fetchJournalEntries(),]);
        setLogs(data);
        setTags(tagData);
        setEntries(journalData);
    } catch (err) {
        console.error("Failed to load:", err);
    }
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

      {/*Mood form*/}
      <MoodLogger 
        onSaved={loadLogs} 
        tags={tags}
        onTagsUpdated={(newTag) => 
            setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }))
        }
      />

      {/*Mood history list*/}
      <MoodHistory logs={logs} tags={tags} onRefresh={loadLogs}
        onTagsUpdated={(newTag) =>
            setTags((prev) => ({ ...prev, custom: [...prev.custom, newTag] }))
        }
      />

      {/* Journal entry editor */}
    <div className="w-full max-w-3xl mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Write</h2>
        <JournalEditor onSaved={loadLogs} />
    </div>

      {/* Journal entry list */}
        <JournalEntryList entries={entries} />
    </main>
  );
}