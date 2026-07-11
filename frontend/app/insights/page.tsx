"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, TrendingUp, Maximize2, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import { checkAuthStatus, logoutUser } from "../../../shared/api";
import { computeWellnessScore, WellnessBreakdown } from "../../components/insights/WellnessScore";
import type { Habit } from "../../components/dashboard/HabitRow";
import type { Goal } from "../../components/dashboard/GoalCard";
import type { DayData } from "../../components/nutrition/NutritionChart";
import type { Supplement } from "../../components/nutrition/SupplementTracker";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const ENDPOINTS = {
  habits: `${API_BASE}/api/habits`,
  habitsHistory: `${API_BASE}/api/habits/history?days=30`,
  goals: `${API_BASE}/api/goals`,
  goalsHistory: `${API_BASE}/api/goals/history?days=30`,
  nutritionHistory: `${API_BASE}/api/nutrition/history?days=30`,
  supplements: `${API_BASE}/api/supplements`,
  supplementsHistory: `${API_BASE}/api/supplements/history?days=30`,
  metrics: `${API_BASE}/api/user/metrics`,
};

const CATEGORY_COLORS: Record<keyof Omit<WellnessBreakdown, "overall">, string> = {
  habits: "#1D9E75",
  goals: "#4f46e5",
  nutrition: "#f59e0b",
  supplements: "#dc2626",
};

// Converts an array of flat objects into a downloadable CSV file.
// Kept generic so the same helper serves all 4 export buttons.
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    alert("Nothing to export yet — no data logged for this category.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val).replace(/"/g, '""');
          // Quote any value containing a comma, quote, or newline
          return /[",\n]/.test(str) ? `"${str}"` : str;
        })
        .join(","),
    ),
  ];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InsightsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [nutritionHistory, setNutritionHistory] = useState<DayData[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState({ calories: 2300, protein: 140 });
  const [expandedChart, setExpandedChart] = useState<string | null>(null);


  const [habitsHistory, setHabitsHistory] = useState<{ date: string; completedCount: number; totalHabits: number }[]>([]);
  const [goalsHistory, setGoalsHistory] = useState<{ date: string; avgProgress: number }[]>([]);
  const [supplementsHistory, setSupplementsHistory] = useState<{ date: string; takenCount: number; totalSupplements: number }[]>([]);

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setAuthLoading(false);
    };
    init();
  }, [router]);

  const fetchInsightsData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [habitsRes, goalsRes, historyRes, suppsRes, metricsRes, habitsHistRes, goalsHistRes, suppsHistRes] = await Promise.all([
        fetch(ENDPOINTS.habits, { credentials: "include" }),
        fetch(ENDPOINTS.goals, { credentials: "include" }),
        fetch(ENDPOINTS.nutritionHistory, { credentials: "include" }),
        fetch(ENDPOINTS.supplements, { credentials: "include" }),
        fetch(ENDPOINTS.metrics, { credentials: "include" }),
        fetch(ENDPOINTS.habitsHistory, { credentials: "include" }),
        fetch(ENDPOINTS.goalsHistory, { credentials: "include" }),
        fetch(ENDPOINTS.supplementsHistory, { credentials: "include" }),
      ]);
      if (habitsHistRes.ok) setHabitsHistory(await habitsHistRes.json());
      if (goalsHistRes.ok) setGoalsHistory(await goalsHistRes.json());
      if (suppsHistRes.ok) setSupplementsHistory(await suppsHistRes.json());
      if (habitsRes.ok) setHabits(await habitsRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (historyRes.ok) setNutritionHistory(await historyRes.json());
      if (suppsRes.ok) {
        const suppsData = await suppsRes.json();
        setSupplements(suppsData);
        // Reconstruct today's checked state the same way the nutrition page does, so the supplements score reflects what's actually checked today.
        const next = new Set<string>();
        suppsData.forEach((s: Supplement & { takenToday?: boolean; timing: string; id: string | number }) => {
          if (s.takenToday) {
            if (s.timing === "AM" || s.timing === "Both") next.add(`AM-${s.id}`);
            if (s.timing === "PM" || s.timing === "Both") next.add(`PM-${s.id}`);
          }
        });
        setCheckedIds(next);
      }
      if (metricsRes.ok) {
        const m = await metricsRes.json();
        if (m.weight_kg) {
          const weight = parseFloat(m.weight_kg);
          const goal = m.fitness_goal || "maintain";
          let cal = Math.round(weight * 24 * 1.2);
          if (goal === "muscle_gain") cal += 300;
          if (goal === "fat_loss") cal -= 300;
          setTargets({ calories: cal, protein: Math.round(weight * 1.5) });
        }
      }
    } catch (err) {
      console.error("Failed to load insights data:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchInsightsData();
  }, [authLoading, fetchInsightsData]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
    router.push("/");
  };

  const score: WellnessBreakdown = computeWellnessScore({
    habits,
    goals,
    nutritionHistory,
    calorieTarget: targets.calories,
    proteinTarget: targets.protein,
    supplements,
    checkedIds,
  });

  // Per-day nutrition score trend
  const nutritionTrend = nutritionHistory
    .filter((d) => d.meal_count > 0)
    .map((d) => {
      const caloriePct = Math.max(0, 100 - (Math.abs(d.calories - targets.calories) / targets.calories) * 100);
      const proteinPct = Math.min(100, (d.protein / targets.protein) * 100);
      return { date: d.date, score: Math.round((caloriePct + proteinPct) / 2) };
    });

  // Habits: % of habits completed each day, from the new aggregate history endpoint
  const habitsTrend = habitsHistory
    .filter((d) => d.totalHabits > 0)
    .map((d) => ({ date: d.date, score: Math.round((d.completedCount / d.totalHabits) * 100) }));

  // Goals: daily average progress across all goals is already a 0-100 score
  const goalsTrend = goalsHistory.map((d) => ({ date: d.date, score: d.avgProgress }));

  // Supplements: % of supplements taken each day
  const supplementsTrend = supplementsHistory
    .filter((d) => d.totalSupplements > 0)
    .map((d) => ({ date: d.date, score: Math.round((d.takenCount / d.totalSupplements) * 100) }));

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background-tertiary,#f5f5f2)]">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background-tertiary, #f5f5f2)",
        fontFamily: "var(--font-sans)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "2rem",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{today}</p>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Insights
          </h1>
        </div>
        <Navbar onLogout={handleLogout} />
      </div>

      {dataLoading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>Loading insights...</p>
      ) : (
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Overall wellness score + category breakdown */}
          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-lg)",
              padding: "1.5rem",
              display: "flex",
              gap: "2rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ textAlign: "center", minWidth: 140 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Overall
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 42, fontWeight: 600, color: "var(--color-text-primary)" }}>
                {score.overall}
              </p>
            </div>

            <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: "10px" }}>
              {(Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[]).map((key) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, textTransform: "capitalize", color: "var(--color-text-primary)" }}>
                      {key}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {score[key]}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${score[key]}%`,
                        background: CATEGORY_COLORS[key],
                        borderRadius: 99,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
              <TrendingUp size={16} style={{ color: "var(--color-text-primary)" }} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
                30-day trends
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "1.5rem",
              }}
            >
              <TrendChartCard
                chartKey="habits"
                label="Habits"
                color={CATEGORY_COLORS.habits}
                data={habitsTrend}
                emptyMessage="No habit logs yet in the last 30 days — this fills in as you check off habits."
                onExpand={setExpandedChart}
                onExport={() =>
                  downloadCsv(
                    "habits_trend.csv",
                    habitsTrend.map((d) => ({ date: d.date, score: d.score })),
                  )
                }
              />
              <TrendChartCard
                chartKey="goals"
                label="Goals"
                color={CATEGORY_COLORS.goals}
                data={goalsTrend}
                emptyMessage="No goal progress recorded yet — this fills in as milestones are checked off."
                onExpand={setExpandedChart}
                onExport={() =>
                  downloadCsv(
                    "goals_trend.csv",
                    goalsTrend.map((d) => ({ date: d.date, score: d.score })),
                  )
                }
              />
              <TrendChartCard
                chartKey="nutrition"
                label="Nutrition"
                color={CATEGORY_COLORS.nutrition}
                data={nutritionTrend}
                emptyMessage="No logged nutrition days yet in the last 30 days — this fills in as you log meals."
                onExpand={setExpandedChart}
                onExport={() =>
                  downloadCsv(
                    "nutrition_trend.csv",
                    nutritionTrend.map((d) => ({ date: d.date, score: d.score })),
                  )
                }
              />
              <TrendChartCard
                chartKey="supplements"
                label="Supplements"
                color={CATEGORY_COLORS.supplements}
                data={supplementsTrend}
                emptyMessage="No supplement logs yet in the last 30 days — this fills in as you check them off."
                onExpand={setExpandedChart}
                onExport={() =>
                  downloadCsv(
                    "supplements_trend.csv",
                    supplementsTrend.map((d) => ({ date: d.date, score: d.score })),
                  )
                }
              />
            </div>
          </div>

          {/* Fullscreen modal for whichever chart was expanded */}
          {expandedChart &&
            (() => {
              const chartMap: Record<string, { label: string; color: string; data: { date: string; score: number }[]; emptyMessage: string }> = {
                habits: {
                  label: "Habits",
                  color: CATEGORY_COLORS.habits,
                  data: habitsTrend,
                  emptyMessage: "No habit logs yet in the last 30 days. This fills in as you check off habits.",
                },
                goals: {
                  label: "Goals",
                  color: CATEGORY_COLORS.goals,
                  data: goalsTrend,
                  emptyMessage: "No goal progress recorded yet. This fills in as milestones are checked off.",
                },
                nutrition: {
                  label: "Nutrition",
                  color: CATEGORY_COLORS.nutrition,
                  data: nutritionTrend,
                  emptyMessage: "No logged nutrition days yet in the last 30 days. This fills in as you log meals.",
                },
                supplements: {
                  label: "Supplements",
                  color: CATEGORY_COLORS.supplements,
                  data: supplementsTrend,
                  emptyMessage: "No supplement logs yet in the last 30 days. This fills in as you check them off.",
                },
              };
              const chart = chartMap[expandedChart];
              if (!chart) return null;
              return (
                <div
                  onClick={() => setExpandedChart(null)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 100,
                    padding: "2rem",
                  }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: "var(--color-background-primary)",
                      borderRadius: "var(--border-radius-lg)",
                      padding: "1.75rem",
                      width: "100%",
                      maxWidth: 900,
                      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {chart.label} — 30-day trend
                      </h3>
                      <button
                        onClick={() => setExpandedChart(null)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 6,
                          borderRadius: 6,
                          color: "#64748b",
                        }}
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <TrendChart
                      label={chart.label}
                      color={chart.color}
                      data={chart.data}
                      emptyMessage={chart.emptyMessage}
                      height={340}
                      showLabel={false}
                    />
                  </div>
                </div>
              );
            })()}

          {/* Per-category CSV export */}
          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-lg)",
              padding: "1.5rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              Export your data
            </h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ExportButton
                label="Habits"
                onClick={() =>
                  downloadCsv(
                    "habits.csv",
                    habits.map((h) => ({
                      name: h.name,
                      category: h.category ?? "",
                      streak: h.streak,
                      total_days: h.totalDays ?? 0,
                      this_week_completed: h.completedDays.filter(Boolean).length,
                    })),
                  )
                }
              />
              <ExportButton
                label="Goals"
                onClick={() =>
                  downloadCsv(
                    "goals.csv",
                    goals.map((g) => ({
                      title: g.title,
                      progress: g.progress,
                    })),
                  )
                }
              />
              <ExportButton
                label="Nutrition (30d)"
                onClick={() =>
                  downloadCsv(
                    "nutrition_history.csv",
                    nutritionHistory.map((d) => ({
                      date: d.date,
                      calories: d.calories,
                      protein: d.protein,
                      carbs: d.carbs,
                      fats: d.fats,
                      meal_count: d.meal_count,
                    })),
                  )
                }
              />
              <ExportButton
                label="Supplements"
                onClick={() =>
                  downloadCsv(
                    "supplements.csv",
                    supplements.map((s) => ({
                      name: s.name,
                      dose: s.dose ?? "",
                      timing: s.timing,
                      streak: s.streak ?? 0,
                      supply_count: s.supplyCount ?? "",
                      daily_dose: s.dailyDose ?? "",
                    })),
                  )
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Builds a smooth curve through points using quadratic bezier midpoints 
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    path += ` Q ${curr.x} ${curr.y} ${midX} ${(curr.y + next.y) / 2}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

function TrendChart({
  label,
  color,
  data,
  emptyMessage,
  height = 100,
  showLabel = true,
}: {
  label: string;
  color: string;
  data: { date: string; score: number }[];
  emptyMessage: string;
  height?: number;
  showLabel?: boolean;
}) {
  const chartHeight = height;
  const padLeft = 26; // room for the y-axis value labels (0/50/100)
  const padRight = 12;
  const padTop = 10;
  const padBottom = 24; // room for date labels below the plot area
  const chartWidth = Math.max(280, data.length * 32);
  const plotHeight = chartHeight - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padLeft + i * ((chartWidth - padLeft - padRight) / Math.max(1, data.length - 1)),
    y: padTop + plotHeight - (d.score / 100) * plotHeight,
  }));
  const linePath = buildSmoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`
      : "";

  // Show a short weekday-style label under every ~5th point so dates don't collide
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div>
      {showLabel && (
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
          {label}
        </p>
      )}
      {data.length === 0 ? (
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{emptyMessage}</p>
      ) : (
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          style={{ width: "100%", maxWidth: chartWidth, height: chartHeight, display: "block" }}
        >
          {/* Horizontal gridlines at 0/50/100, with their value printed on the left */}
          {[0, 50, 100].map((y) => {
            const lineY = padTop + plotHeight - (y / 100) * plotHeight;
            return (
              <g key={y}>
                <line x1={padLeft} x2={chartWidth - padRight} y1={lineY} y2={lineY} stroke="#e2e8f0" strokeWidth={0.5} />
                <text x={padLeft - 6} y={lineY + 3} fontSize={8} fill="#94a3b8" textAnchor="end">
                  {y}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill={color} fillOpacity={0.1} stroke="none" />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          {points.length > 0 && (
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={color} stroke="white" strokeWidth={1.5} />
          )}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={6} fill="transparent">
              <title>{`${data[i].date}: ${data[i].score}`}</title>
            </circle>
          ))}

          {/* Sparse date labels along the bottom, short month/day format */}
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <text
                key={i}
                x={points[i].x}
                y={chartHeight - 6}
                fontSize={8}
                fill="#94a3b8"
                textAnchor="middle"
              >
                {new Date(d.date + "T00:00:00Z").toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}

function TrendChartCard({
  chartKey,
  label,
  color,
  data,
  emptyMessage,
  onExpand,
  onExport,
}: {
  chartKey: string;
  label: string;
  color: string;
  data: { date: string; score: number }[];
  emptyMessage: string;
  onExpand: (key: string) => void;
  onExport: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onExport}
            title="Export CSV"
            aria-label={`Export ${label} data`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--color-border-secondary)",
              background: "rgba(255,255,255,0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <Download size={13} />
          </button>
          <button
            onClick={() => onExpand(chartKey)}
            title="Expand"
            aria-label={`Expand ${label} chart`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--color-border-secondary)",
              background: "rgba(255,255,255,0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
      <TrendChart label={label} color={color} data={data} emptyMessage={emptyMessage} showLabel={false} />
    </div>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid var(--color-border-secondary)",
        background: "rgba(255,255,255,0.7)",
        color: "#334155",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <Download size={14} />
      {label}
    </button>
  );
}