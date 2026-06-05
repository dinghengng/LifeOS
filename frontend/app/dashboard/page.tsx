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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal display toggles
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Form states
  const [habitName, setHabitName] = useState("");
  const [habitIcon, setHabitIcon] = useState("🏃");
  const [habitColor, setHabitColor] = useState("#1D9E75");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("Fitness");
  const [goalColor, setGoalColor] = useState("#534AB7");
  const [goalDueDate, setGoalDueDate] = useState("");
  const [goalMilestones, setGoalMilestones] = useState("");

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
        fetch(`${API_BASE}/api/goals`, { credentials: "include" }),
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

  // habit toggle
  async function toggleToday(id: string) {
    let fallbackHabits: Habit[] = [];

    setHabits((prev) => {
      fallbackHabits = prev;
      return prev.map((h) => {
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
      const res = await fetch(`${API_BASE}/api/habits/${id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Sync failed");
    } catch (err) {
      console.error(err);
      setHabits(fallbackHabits); // Roll back if network breaks
    }
  }

  //for milestone toggle we want to update the progress to reflect asap
  async function toggleMilestone(goalId: string, milestoneIndex: number) {
    let fallbackGoals: Goal[] = [];

    setGoals((prev) => {
      fallbackGoals = prev;
      return prev.map((goal) => {
        if (goal.id !== goalId) return goal;

        // Update target milestone by its item index array sequence
        const updatedMilestones = goal.milestones.map((m, i) =>
          i === milestoneIndex ? { ...m, done: !m.done } : m,
        );

        // Calculate progress
        const completedCount = updatedMilestones.filter((m) => m.done).length;
        const calculatedProgress =
          updatedMilestones.length > 0
            ? Math.round((completedCount / updatedMilestones.length) * 100)
            : 0;

        return {
          ...goal,
          progress: calculatedProgress,
          milestones: updatedMilestones,
        };
      });
    });

    try {
      const res = await fetch(
        `${API_BASE}/api/goals/${goalId}/milestones/${milestoneIndex}`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Server rejected milestone toggle");
    } catch (err) {
      console.error("Milestone sync failure:", err);
      setGoals(fallbackGoals);
    }
  }
  // Handle Form for Habit
  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!habitName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: habitName,
          icon: habitIcon,
          color: habitColor,
        }),
      });
      if (res.ok) {
        const newHabit = await res.json();
        setHabits([...habits, newHabit]);
        setShowHabitModal(false);
        setHabitName("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Form Submission for create Goal
  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim() || !goalDueDate.trim()) return;

    const milestonesArray = goalMilestones
      .split("\n")
      .filter((m) => m.trim().length > 0);

    try {
      const res = await fetch(`${API_BASE}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: goalTitle,
          category: goalCategory,
          color: goalColor,
          dueDate: goalDueDate,
          milestones: milestonesArray,
        }),
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals([...goals, newGoal]);
        setShowGoalModal(false);
        setGoalTitle("");
        setGoalDueDate("");
        setGoalMilestones("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
    router.push("/");
  };

  const today = new Date().toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const completedToday = habits.filter((h) => h.completedDays[6]).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const avgGoalProgress = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background-tertiary,#f5f5f2)]">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background-tertiary, #f5f5f2)",
        fontFamily: "var(--font-sans)",
        padding: "2rem",
      }}
    >
      {/* Header bar layout */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "2rem",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            {today}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {user?.name ? `${user.name}'s dashboard` : "Your dashboard"}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Tasks
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid #4f46e5",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/journal")}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Journal
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {/* error msg */}
      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            textAlign: "center",
            border: "1px solid #fca5a5",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {dataLoading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>Loading...</p>
      ) : (
        <>
          <StatsSummary
            completedToday={completedToday}
            totalHabits={habits.length}
            totalStreak={totalStreak}
            avgGoalProgress={avgGoalProgress}
          />

          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              width: "100%",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <HabitTracker
                habits={habits}
                onToggleToday={toggleToday}
                onAddClick={() => setShowHabitModal(true)}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <GoalTracker
                goals={goals}
                onAddClick={() => setShowGoalModal(true)}
                onMilestoneToggle={toggleMilestone}
              />
            </div>
          </div>
        </>
      )}

      {/* HABIT FORM pending changes for the categories */}
      {showHabitModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleCreateHabit}
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              width: "360px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>Add New Habit</h3>
            <input
              type="text"
              placeholder="Habit description (e.g. Morning stretch)"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                color: "#1e293b",
              }}
              required
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748b" }}>Icon</span>
                <select
                  value={habitIcon}
                  onChange={(e) => setHabitIcon(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    color: "#1e293b",
                  }}
                >
                  <option value="🏃">🏃 Physical</option>
                  <option value="🧘">🧘 Spiritual</option>
                  <option value="💧">💧 Health</option>
                  <option value="🥗">🥗 Food</option>
                  <option value="💻">💻 Study or Work?</option>
                </select>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Theme Color
                </span>
                <select
                  value={habitColor}
                  onChange={(e) => setHabitColor(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    color: "#1e293b",
                  }}
                >
                  <option value="#1D9E75">Mint Green</option>
                  <option value="#534AB7">Indigo</option>
                  <option value="#D85A30">Orange</option>
                  <option value="#378ADD">Ocean Blue</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setShowHabitModal(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "white",
                  color: "#1e293b",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GOAL CREATION FORM under maintenance */}
      {showGoalModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleCreateGoal}
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              width: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>Add Long-term Goal</h3>
            <input
              type="text"
              placeholder="Goal Objective (e.g. Read 24 books)"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                color: "#1e293b",
              }}
              required
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                placeholder="Category (e.g. Health)"
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  color: "#1e293b",
                }}
              />
              <input
                type="text"
                placeholder="Target Date (e.g. Dec 2026)"
                value={goalDueDate}
                onChange={(e) => setGoalDueDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  color: "#1e293b",
                }}
                required
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Theme Color
              </span>
              <select
                value={goalColor}
                onChange={(e) => setGoalColor(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  color: "#1e293b",
                }}
              >
                <option value="#534AB7">Indigo</option>
                <option value="#1D9E75">Mint Green</option>
                <option value="#D85A30">Orange</option>
              </select>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Checklist Milestones (One per line)
              </span>
              <textarea
                placeholder="Subtask milestone 1&#10;Subtask milestone 2"
                value={goalMilestones}
                onChange={(e) => setGoalMilestones(e.target.value)}
                rows={3}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontFamily: "inherit",
                  color: "#1e293b",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "white",
                  color: "#1e293b",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
