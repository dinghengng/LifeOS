"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatsSummary from "../../components/dashboard/StatsSummary";
import HabitTracker from "../../components/dashboard/HabitTracker";
import GoalTracker from "../../components/dashboard/GoalTracker";
import { Habit, getTodayIndexSGT, computeStreak } from "../../components/dashboard/HabitRow";
import { HeatmapDay } from "../../components/dashboard/HabitHeatmap";
import { Goal } from "../../components/dashboard/GoalCard";
import { User } from "../../../shared/types";
import { checkAuthStatus, logoutUser } from "../../../shared/api";
import Navbar from "../../components/Navbar";
import { useToastContext } from "../../components/notifications/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const GOAL_CATEGORIES = ["Fitness", "Spiritual", "Relationship", "Career", "Finance"];
const GOAL_CATEGORY_ICONS: Record<string, string> = {
  Fitness: "🏃",
  Spiritual: "🧘",
  Relationship: "❤️",
  Career: "💼",
  Finance: "💰",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, i) => currentYear + i); // 10 years, long enough for a goal
}

// Parses a saved "Month Year" string (e.g. "May 2026") back into separate parts for editing.
// Falls back to empty strings if the format doesn't match 
function parseDueDate(dueDate: string): { month: string; year: string } {
  const match = dueDate.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (match && MONTH_NAMES.includes(match[1])) {
    return { month: match[1], year: match[2] };
  }
  return { month: "", year: "" };
}

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
  const [habitColor, setHabitColor] = useState("#1D9E75");
  const [habitCategory, setHabitCategory] = useState(GOAL_CATEGORIES[0]);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState(GOAL_CATEGORIES[0]);
  const [goalColor, setGoalColor] = useState("#534AB7");
  const [goalMonth, setGoalMonth] = useState("");
  const [goalYear, setGoalYear] = useState("");
  const [goalMilestones, setGoalMilestones] = useState("");

  // Track which habit/goal (if any) is currently being edited
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const { showToast } = useToastContext();

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
      //showToast("Failed to load dashboard data", "error");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchDashboardData();
  }, [authLoading, fetchDashboardData]);

  const STREAK_MILESTONES = [7, 30, 100];

// habit toggle
 async function toggleToday(id: string) {
    const todayIndex = getTodayIndexSGT();
    
    // Find the target habit and calculate the new state FIRST
    const targetHabit = habits.find((h) => h.id === id);
    if (!targetHabit) return;

    const days = [...targetHabit.completedDays];
    const wasOn = days[todayIndex];
    days[todayIndex] = !days[todayIndex];

    // Turning a day "done" clears any rest-day flag on it — a habit can't be both.
    const skips = [...(targetHabit.skippedDays ?? Array(7).fill(false))];
    if (days[todayIndex]) skips[todayIndex] = false;

    const newStreak = computeStreak(days, skips, todayIndex);

    // Trigger the toast immediately if a milestone is hit
    if (newStreak > targetHabit.streak && STREAK_MILESTONES.includes(newStreak)) {
      showToast(`🔥 ${newStreak}-day streak on "${targetHabit.name}"!`, "success");
    }

    const newTotalDays = wasOn ? (targetHabit.totalDays || 0) : (targetHabit.totalDays || 0) + 1;

    // Update the UI 
    const fallbackHabits = [...habits];
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, completedDays: days, skippedDays: skips, streak: newStreak, totalDays: newTotalDays }
          : h
      )
    );

    // Sync with the server
    try {
      const res = await fetch(`${API_BASE}/api/habits/${id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Sync failed");
      
      const data = await res.json();
      setHabits((prev) =>
        prev.map((h) =>
          h.id !== id
            ? h
            : {
                ...h,
                streak: data.streak ?? h.streak,
                totalDays: data.totalDays ?? h.totalDays,
              }
        )
      );
    } catch (err) {
      console.error(err);
      setHabits(fallbackHabits); // Roll back if network breaks
    }
  }

  // habit rest-day toggle — marks/unmarks today as a streak-safe skip
  async function toggleSkipToday(id: string) {
    const todayIndex = getTodayIndexSGT();
    const targetHabit = habits.find((h) => h.id === id);
    if (!targetHabit) return;

    const skips = [...(targetHabit.skippedDays ?? Array(7).fill(false))];
    const days = [...targetHabit.completedDays];

    skips[todayIndex] = !skips[todayIndex];
    // A rest day can't also be marked done.
    if (skips[todayIndex]) days[todayIndex] = false;

    const newStreak = computeStreak(days, skips, todayIndex);

    const fallbackHabits = [...habits];
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completedDays: days, skippedDays: skips, streak: newStreak } : h
      )
    );

    try {
      const res = await fetch(`${API_BASE}/api/habits/${id}/skip`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Skip sync failed");

      const data = await res.json();
      setHabits((prev) =>
        prev.map((h) => (h.id !== id ? h : { ...h, streak: data.streak ?? h.streak }))
      );
    } catch (err) {
      console.error(err);
      setHabits(fallbackHabits);
    }
  }

  // Lazily fetches ~90 days of history for the heatmap. Expects the backend to return
  // an ascending array of { date: "YYYY-MM-DD", status: "done"|"skipped"|"missed" }.
  // Falls back to [] (heatmap just won't render) if the endpoint isn't there yet.
  async function getHabitHistory(id: string): Promise<HeatmapDay[]> {
    try {
      const res = await fetch(`${API_BASE}/api/habits/${id}/history?days=90`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("History fetch failed");
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
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
      //showToast("Failed to update milestone", "error");
    }
  }

  // habit delete
  async function deleteHabit(id: string) {
    let fallbackHabits: Habit[] = [];

    setHabits((prev) => {
      fallbackHabits = prev;
      return prev.filter((h) => h.id !== id);
    });

    try {
      const res = await fetch(`${API_BASE}/api/habits/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      //showToast("Habit deleted", "success");
    } catch (err) {
      console.error("Habit delete failure:", err);
      setHabits(fallbackHabits); // Roll back if network breaks
      //showToast("Failed to delete habit", "error");
    }
  }

  // goal delete
  async function deleteGoal(id: string) {
    let fallbackGoals: Goal[] = [];

    setGoals((prev) => {
      fallbackGoals = prev;
      return prev.filter((g) => g.id !== id);
    });

    try {
      const res = await fetch(`${API_BASE}/api/goals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      //showToast("Goal deleted", "success");
    } catch (err) {
      console.error("Goal delete failure:", err);
      setGoals(fallbackGoals); // Roll back if network breaks
      //showToast("Failed to delete goal.", "error");
    }
  }

  // Open habit modal for editing
  function handleEditHabitClick(habit: Habit) {
    setEditingHabitId(habit.id);
    setHabitName(habit.name);
    setHabitColor(habit.color);
    setHabitCategory(habit.category || GOAL_CATEGORIES[0]);
    setShowHabitModal(true);
  }

  // Open goal for editing
  function handleEditGoalClick(goal: Goal) {
    setEditingGoalId(goal.id);
    setGoalTitle(goal.title);
    setGoalCategory(goal.category);
    setGoalColor(goal.color);
    const { month, year } = parseDueDate(goal.dueDate);
    setGoalMonth(month);
    setGoalYear(year);
    setGoalMilestones(goal.milestones.map((m) => m.label).join("\n"));
    setShowGoalModal(true);
  }

  function resetGoalForm() {
  setEditingGoalId(null);
  setGoalTitle("");
  setGoalCategory(GOAL_CATEGORIES[0]);
  setGoalColor("#534AB7");
  setGoalMonth("");
  setGoalYear("");
  setGoalMilestones("");
}

  // Handle Form for Habit
  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!habitName.trim()) return;

    // No icon picker in the form — icon is derived from the chosen category so habit rows
    // still have something to display, without asking the user to pick it separately.
    const derivedIcon = GOAL_CATEGORY_ICONS[habitCategory] || "🏃";

    try {
      // If editing an existing habit, update it instead of creating a new one
      if (editingHabitId) {
        const res = await fetch(`${API_BASE}/api/habits/${editingHabitId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: habitName,
            icon: derivedIcon,
            color: habitColor,
            category: habitCategory,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setHabits((prev) =>
            prev.map((h) =>
              h.id === editingHabitId
                ? { ...h, name: habitName, icon: derivedIcon, color: habitColor, category: updated.category ?? habitCategory }
                : h,
            ),
          );
          setShowHabitModal(false);
          setHabitName("");
          setEditingHabitId(null);
          showToast("Habit updated", "success");
        } else {
          showToast("Failed to update habit", "error");
        }
        return;
      }

      const res = await fetch(`${API_BASE}/api/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: habitName,
          icon: derivedIcon,
          color: habitColor,
          category: habitCategory,
        }),
      });
      if (res.ok) {
        const newHabit = await res.json();
        setHabits([...habits, { ...newHabit, category: newHabit.category ?? habitCategory }]);
        setShowHabitModal(false);
        setHabitName("");
        showToast("Habit added", "success");
      } else {
        showToast("Failed to create habit", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
    }
  }

  // Handle Form Submission for create Goal
  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim() || !goalMonth || !goalYear) return;

    const goalDueDate = `${goalMonth} ${goalYear}`; 

    const milestonesArray = goalMilestones
      .split("\n")
      .filter((m) => m.trim().length > 0);

    try {
      // If editing an existing goal, update it instead of creating a new one
      if (editingGoalId) {
        const res = await fetch(`${API_BASE}/api/goals/${editingGoalId}`, {
          method: "PATCH",
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
          setGoals((prev) =>
            prev.map((g) => {
              if (g.id !== editingGoalId) return g;
              const updatedMilestones = milestonesArray.map((label) => {
                const existing = g.milestones.find((m) => m.label === label);
                return { label, done: existing ? existing.done : false };
              });

              const completedCount = updatedMilestones.filter((m) => m.done).length;
              const calculatedProgress =
                updatedMilestones.length > 0
                  ? Math.round((completedCount / updatedMilestones.length) * 100)
                  : 0;

              return {
                ...g,
                title: goalTitle,
                category: goalCategory,
                color: goalColor,
                dueDate: goalDueDate,
                milestones: updatedMilestones,
                progress: calculatedProgress,
              };
            }),
          );
          setShowGoalModal(false);
          resetGoalForm();
          showToast("Goal updated", "success");
        } else {
          showToast("Failed to update goal", "error");
        }
        return;
      }

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
        setGoalMonth("");
        setGoalYear("");
        setGoalMilestones("");
        showToast("Goal added", "success");
      } else {
        showToast("Failed to create goal", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
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
  const completedToday = habits.filter((h) => h.completedDays[getTodayIndexSGT()]).length;
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
          <Navbar onLogout={handleLogout} />
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
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.75rem" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="skeleton-pulse"
                style={{ height: 64, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)" }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "1.5rem", width: "100%", alignItems: "flex-start" }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="skeleton-pulse"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 320,
                  borderRadius: "var(--border-radius-lg)",
                  background: "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                }}
              />
            ))}
          </div>
          <style jsx>{`
            .skeleton-pulse {
              animation: pulse 1.5s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </>
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
                onToggleSkip={toggleSkipToday}
                getHabitHistory={getHabitHistory}
                onAddClick={() => {
                  setEditingHabitId(null);
                  setHabitName("");
                  setHabitColor("#1D9E75");
                  setHabitCategory(GOAL_CATEGORIES[0]);
                  setShowHabitModal(true);
                }}
                onEditHabit={handleEditHabitClick}
                onDeleteHabit={deleteHabit}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <GoalTracker
                goals={goals}
                onAddClick={() => {
                  resetGoalForm();
                  setShowGoalModal(true);
                }}
                onMilestoneToggle={toggleMilestone}
                onEditGoal={handleEditGoalClick}
                onDeleteGoal={deleteGoal}
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
            <h3 style={{ margin: 0, color: "#1e293b" }}>{editingHabitId ? "Edit Habit" : "Add New Habit"}</h3>
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
                <span style={{ fontSize: "12px", color: "#64748b" }}>Category</span>
                <select
                  value={habitCategory}
                  onChange={(e) => setHabitCategory(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    color: "#1e293b",
                  }}
                >
                  {GOAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {GOAL_CATEGORY_ICONS[cat]} {cat}
                    </option>
                  ))}
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
                onClick={() => {
                  setShowHabitModal(false);
                  setEditingHabitId(null);
                  setHabitName("");
                }}
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
              width: "500px", // Increased from 400px so the target date text actually fits!
              maxWidth: "100%", 
              boxSizing: "border-box", 
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>{editingGoalId ? "Edit Goal" : "Add Long-term Goal"}</h3>
            
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
                width: "100%",
                boxSizing: "border-box",
              }}
              required
            />
            
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Category
              </span>
              <select
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  color: "#1e293b",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {GOAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {GOAL_CATEGORY_ICONS[cat]} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Target Date
              </span>
              <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                <select
                  value={goalMonth}
                  onChange={(e) => setGoalMonth(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    color: goalMonth ? "#1e293b" : "#94a3b8",
                    boxSizing: "border-box",
                  }}
                  required
                >
                  <option value="" disabled>
                    Month
                  </option>
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={goalYear}
                  onChange={(e) => setGoalYear(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    color: goalYear ? "#1e293b" : "#94a3b8",
                    boxSizing: "border-box",
                  }}
                  required
                >
                  <option value="" disabled>
                    Year
                  </option>
                  {getYearOptions().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <option value="#534AB7">Indigo</option>
                <option value="#1D9E75">Mint Green</option>
                <option value="#D85A30">Orange</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Checklist Milestones (One per line)
              </span>
              <textarea
                // React requires curly braces and standard \n for line breaks in placeholders
                placeholder={"Subtask milestone 1\nSubtask milestone 2\nSubtask milestone 3"} 
                value={goalMilestones}
                onChange={(e) => setGoalMilestones(e.target.value)}
                rows={3}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontFamily: "inherit",
                  color: "#1e293b",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowGoalModal(false);
                  resetGoalForm();
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "white",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  fontWeight: "bold",
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