"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodLogger from "../../components/MoodLogger";
import MoodHistory from "../../components/MoodHistory";
import { MoodLog, User } from "../../../shared/types";
import { fetchMoodLogs, checkAuthStatus } from "../../../shared/api";

export default function JournalPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
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
      const data = await fetchMoodLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load mood logs:", err);
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
      <MoodLogger onSaved={loadLogs} />

      {/*Mood history list*/}
      <MoodHistory logs={logs} />
    </main>
  );
}