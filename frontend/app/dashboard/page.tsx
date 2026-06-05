"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatsSummary from "../../components/dashboard/StatsSummary";
import HabitTracker from "../../components/dashboard/HabitTracker";
import GoalTracker from "../../components/dashboard/GoalTracker";
import { Habit } from "../../components/dashboard/HabitRow";
import { Goal } from "../../components/dashboard/GoalCard";
import { User } from "../../../shared/types";
import { checkAuthStatus, logoutUser } from "../../../shared/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [habits, setHabits]           = useState<Habit[]>([]);
  const [goals, setGoals]             = useState<Goal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Auth check on mount
  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    };
    init();
  }, [router]);

  // Fetch habits + goals
  const fetchDashboardData = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [habitsRes, goalsRes] = await Promise.all([
        fetch(`${API_BASE}/api/habits`, { credentials: "include" }),
        fetch(`${API_BASE}/api/goals`,  { credentials: "include" }),
      ]);
      if (!habitsRes.ok || !goalsRes.ok) throw new Error("Fetch failed");
      setHabits(await habitsRes.json());
      setGoals(await goalsRes.json());
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchDashboardData();
  }, [authLoading, fetchDashboardData]);

  // Optimistic habit completion state updater
  async function toggleToday(id: string) {
    let fallbackHabits: Habit[] = [];

    setHabits(prev => {
      fallbackHabits = prev; 
      return prev.map(h => {
        if (h.id !== id) return h;
        const days = [...h.completedDays];
        const wasOn = days[6];
        days[6] = !days[6];
        return {
          ...h,
          completedDays: days,
          streak: wasOn ? Math.max(0, h.streak - 1) : h.streak + 1,
        };
      });
    });

    try {
      const res = await fetch(`${API_BASE}/api/habits/${id}/toggle`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Sync failed");
    } catch (err) {
      console.error(err);
      setHabits(fallbackHabits); // Reset back to cache copy on api failure
    }
  }

  // Optimistic milestone check handler and progress estimator
  async function toggleMilestone(goalId: string, milestoneIndex: number) {
    let fallbackGoals: Goal[] = [];

    setGoals(prev => {
      fallbackGoals = prev;
      return prev.map(goal => {
        if (goal.id !== goalId) return goal;

        const updatedMilestones = goal.milestones.map((m, i) => 
          i === milestoneIndex ? { ...m, done: !m.done } : m
        );

        const completedCount = updatedMilestones.filter(m => m.done).length;
        const calculatedProgress = updatedMilestones.length > 0 
          ? Math.round((completedCount / updatedMilestones.length) * 100) 
          : 0;

        return {
          ...goal,
          progress: calculatedProgress,
          milestones: updatedMilestones
        };
      });
    });

    try {
      const res = await fetch(`${API_BASE}/api/goals/${goalId}/milestones/${milestoneIndex}`, {
        method: "PATCH",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Server rejected milestone toggle");
    } catch (err) {
      console.error("Milestone sync failure:", err);
      setGoals(fallbackGoals);
    }
  }

  const handleLogout = async () => {
    try { await logoutUser(); } catch (err) { console.error(err); }
    router.push("/");
  };

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });
  const completedToday  = habits.filter(h => h.completedDays[6]).length;
  const totalStreak     = habits.reduce((sum, h) => sum + h.streak, 0);
  const avgGoalProgress = goals.length ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-background-tertiary,#f5f5f2)]">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary, #f5f5f2)", fontFamily: "var(--font-sans)", padding: "2rem" }}>

      {/* Header bar layout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{today}</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>
            {user?.name ? `${user.name}'s dashboard` : "Your dashboard"}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => router.push("/")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Tasks</button>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid #4f46e5", backgroundColor: "#4f46e5", color: "#ffffff", cursor: "pointer" }}>Dashboard</button>
          <button onClick={() => router.push("/journal")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Journal</button>
          <button onClick={handleLogout} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "center", border: "1px solid #fca5a5", fontSize: "14px" }}>
          ⚠️ {error}
        </div>
      )}

      {dataLoading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>Loading...</p>
      ) : (
        <>
          <StatsSummary completedToday={completedToday} totalHabits={habits.length} totalStreak={totalStreak} avgGoalProgress={avgGoalProgress} />

          <div style={{ display: "flex", gap: "1.5rem", width: "100%", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>

              <HabitTracker habits={habits} onToggleToday={toggleToday} onAddClick={() => alert("Add habit clicked")} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <GoalTracker goals={goals} onAddClick={() => alert("Add goal clicked")} onMilestoneToggle={toggleMilestone} />
            </div>
          </div>
        </>
      )}

    </div>
  );
}