"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Download, TrendingUp, Maximize2, X } from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";
import { checkAuthStatus, logoutUser } from "../../../shared/api";
import { computeWellnessScore, WellnessBreakdown } from "../../components/insights/WellnessScore";
import type { Habit } from "../../components/dashboard/HabitRow";
import type { Goal } from "../../components/dashboard/GoalCard";
import type { DayData } from "../../components/nutrition/NutritionChart";
import type { Supplement } from "../../components/nutrition/SupplementTracker";
import { useTranslation } from "../../context/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const ENDPOINTS = {
  habits: `${API_BASE}/api/habits`,
  habitsHistory: (days: number) => `${API_BASE}/api/habits/history?days=${days}`,
  goals: `${API_BASE}/api/goals`,
  goalsHistory: (days: number) => `${API_BASE}/api/goals/history?days=${days}`,
  nutritionHistory: (days: number) => `${API_BASE}/api/nutrition/history?days=${days}`,
  supplements: `${API_BASE}/api/supplements`,
  supplementsHistory: (days: number) => `${API_BASE}/api/supplements/history?days=${days}`,
  metrics: `${API_BASE}/api/user/metrics`,
};

const RANGE_OPTIONS = [7, 14, 30, 90] as const;

const CATEGORY_COLORS: Record<keyof Omit<WellnessBreakdown, "overall">, string> = {
  habits: "#1D9E75",
  goals: "#4f46e5",
  nutrition: "#f59e0b",
  supplements: "#dc2626",
};

type TFunc = (key: string, params?: Record<string, string | number>) => string;

// Returns color based on score. Defined outside the component (no hook access), so `t` is threaded in.
function getScoreStyle(score: number, t: TFunc): { color: string; label: string } {
  if (score >= 75) return { color: "#16a34a", label: t("insightsPage.scoreKeepGoing") };
  if (score >= 50) return { color: "#d97706", label: t("insightsPage.scoreOnTrack") };
  return { color: "#dc2626", label: t("insightsPage.scoreNeedsPush") };
}

// Converts an array of flat objects into a downloadable CSV file.
// `emptyAlertMessage` is passed in from the caller since this helper has no hook access.
function downloadCsv(filename: string, rows: Record<string, unknown>[], emptyAlertMessage: string) {
  if (rows.length === 0) {
    alert(emptyAlertMessage);
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
  const { t, locale } = useTranslation();
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
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [mounted, setMounted] = useState(false);


  useEffect(() => setMounted(true), []);

  // Prevent the page behind the modal from scrolling while it's open.
  useEffect(() => {
    if (expandedChart) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [expandedChart]);


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
        fetch(ENDPOINTS.nutritionHistory(rangeDays), { credentials: "include" }),
        fetch(ENDPOINTS.supplements, { credentials: "include" }),
        fetch(ENDPOINTS.metrics, { credentials: "include" }),
        fetch(ENDPOINTS.habitsHistory(rangeDays), { credentials: "include" }),
        fetch(ENDPOINTS.goalsHistory(rangeDays), { credentials: "include" }),
        fetch(ENDPOINTS.supplementsHistory(rangeDays), { credentials: "include" }),
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
  }, [rangeDays]);

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


  const goToDayDetail = (category: "habits" | "goals" | "nutrition" | "supplements", date: string) => {
    const target = category === "habits" || category === "goals" ? "/dashboard" : "/nutrition";
    router.push(`${target}?date=${date}`);
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
        <p className="text-slate-500">{t("insightsPage.loading")}</p>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Category display labels — resolved once so both the grid and the expanded-chart modal stay in sync.
  const categoryLabels = {
    habits: t("insightsPage.categoryHabits"),
    goals: t("insightsPage.categoryGoals"),
    nutrition: t("insightsPage.categoryNutrition"),
    supplements: t("insightsPage.categorySupplements"),
  };

  return (
    <AppShell>
      <AppHeader
        rightActions={
          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            {t("common.logout")}
          </button>
        }
      />

      <PageHeader eyebrow={new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-SG", { weekday: "long", day: "numeric", month: "long" })} title={t("insightsPage.title")} />

      {dataLoading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>{t("insightsPage.loadingInsights")}</p>
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
                {t("insightsPage.overallLabel")}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 42, fontWeight: 600, color: getScoreStyle(score.overall, t).color }}>
                {score.overall}
                <span style={{ fontSize: 18, fontWeight: 500, color: "#94a3b8" }}>/100</span>
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: getScoreStyle(score.overall, t).color }}>
                {getScoreStyle(score.overall, t).label}
              </p>
            </div>

            <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: "10px" }}>
              {(Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[]).map((key) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, textTransform: "capitalize", color: "var(--color-text-primary)" }}>
                      {categoryLabels[key]}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: getScoreStyle(score[key], t).color }}>
                      {score[key]}
                      <span style={{ color: "#94a3b8", fontWeight: 500 }}>/100</span>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={16} style={{ color: "var(--color-text-primary)" }} />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {t("insightsPage.trendsHeader", { days: rangeDays })}
                </h2>
              </div>

              {/* Shared date range — applies to all 4 charts at once */}
              <div style={{ display: "flex", gap: 2, background: "#eef0f2", borderRadius: 8, padding: 3 }}>
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setRangeDays(opt)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      border: "none",
                      background: rangeDays === opt ? "#ffffff" : "transparent",
                      color: rangeDays === opt ? "#0f172a" : "#64748b",
                      fontSize: 12,
                      fontWeight: rangeDays === opt ? 600 : 500,
                      boxShadow: rangeDays === opt ? "0 1px 3px rgba(15, 23, 42, 0.12)" : "none",
                      cursor: "pointer",
                      transition: "background 0.15s ease, box-shadow 0.15s ease, color 0.15s ease",
                    }}
                  >
                    {t("insightsPage.rangeDaysBtn", { days: opt })}
                  </button>
                ))}
              </div>
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
                label={categoryLabels.habits}
                color={CATEGORY_COLORS.habits}
                data={habitsTrend}
                emptyMessage={t("insightsPage.emptyHabits", { days: rangeDays })}
                onExpand={setExpandedChart}
                onPointClick={(date) => goToDayDetail("habits", date)}
                onExport={() =>
                  downloadCsv(
                    "habits_trend.csv",
                    habitsTrend.map((d) => ({ date: d.date, score: d.score })),
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
              <TrendChartCard
                chartKey="goals"
                label={categoryLabels.goals}
                color={CATEGORY_COLORS.goals}
                data={goalsTrend}
                emptyMessage={t("insightsPage.emptyGoals")}
                onExpand={setExpandedChart}
                onPointClick={(date) => goToDayDetail("goals", date)}
                onExport={() =>
                  downloadCsv(
                    "goals_trend.csv",
                    goalsTrend.map((d) => ({ date: d.date, score: d.score })),
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
              <TrendChartCard
                chartKey="nutrition"
                label={categoryLabels.nutrition}
                color={CATEGORY_COLORS.nutrition}
                data={nutritionTrend}
                emptyMessage={t("insightsPage.emptyNutrition", { days: rangeDays })}
                onExpand={setExpandedChart}
                onPointClick={(date) => goToDayDetail("nutrition", date)}
                onExport={() =>
                  downloadCsv(
                    "nutrition_trend.csv",
                    nutritionTrend.map((d) => ({ date: d.date, score: d.score })),
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
              <TrendChartCard
                chartKey="supplements"
                label={categoryLabels.supplements}
                color={CATEGORY_COLORS.supplements}
                data={supplementsTrend}
                emptyMessage={t("insightsPage.emptySupplements", { days: rangeDays })}
                onExpand={setExpandedChart}
                onPointClick={(date) => goToDayDetail("supplements", date)}
                onExport={() =>
                  downloadCsv(
                    "supplements_trend.csv",
                    supplementsTrend.map((d) => ({ date: d.date, score: d.score })),
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
            </div>
          </div>

          {mounted &&
            expandedChart &&
            createPortal(
              (() => {
                const chartMap: Record<
                  string,
                  { category: "habits" | "goals" | "nutrition" | "supplements"; label: string; color: string; data: { date: string; score: number }[]; emptyMessage: string }
                > = {
                  habits: {
                    category: "habits",
                    label: categoryLabels.habits,
                    color: CATEGORY_COLORS.habits,
                    data: habitsTrend,
                    emptyMessage: t("insightsPage.emptyHabits", { days: rangeDays }),
                  },
                  goals: {
                    category: "goals",
                    label: categoryLabels.goals,
                    color: CATEGORY_COLORS.goals,
                    data: goalsTrend,
                    emptyMessage: t("insightsPage.emptyGoals"),
                  },
                  nutrition: {
                    category: "nutrition",
                    label: categoryLabels.nutrition,
                    color: CATEGORY_COLORS.nutrition,
                    data: nutritionTrend,
                    emptyMessage: t("insightsPage.emptyNutrition", { days: rangeDays }),
                  },
                  supplements: {
                    category: "supplements",
                    label: categoryLabels.supplements,
                    color: CATEGORY_COLORS.supplements,
                    data: supplementsTrend,
                    emptyMessage: t("insightsPage.emptySupplements", { days: rangeDays }),
                  },
                };
                const chart = chartMap[expandedChart];
                if (!chart) return null;
                return (
                  <div
                    onClick={() => setExpandedChart(null)}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(15, 23, 42, 0.55)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 9999,
                      padding: "2rem",
                      isolation: "isolate",
                    }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: "var(--color-background-primary, #ffffff)",
                        borderRadius: "var(--border-radius-lg, 16px)",
                        padding: "1.75rem",
                        width: "100%",
                        maxWidth: 900,
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--color-text-primary, #0f172a)" }}>
                          {t("insightsPage.modalTitle", { label: chart.label, days: rangeDays })}
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
                            flexShrink: 0,
                          }}
                          aria-label={t("insightsPage.closeAriaLabel")}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div style={{ width: "100%" }}>
                        <TrendChart
                          label={chart.label}
                          color={chart.color}
                          data={chart.data}
                          emptyMessage={chart.emptyMessage}
                          height={340}
                          showLabel={false}
                          onPointClick={(date) => goToDayDetail(chart.category, date)}
                          fullWidth
                        />
                      </div>
                      <ChartInsights data={chart.data} />
                    </div>
                  </div>
                );
              })(),
              document.body,
            )}

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
              {t("insightsPage.exportDataHeader")}
            </h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ExportButton
                label={t("insightsPage.exportLabelHabits", { days: rangeDays })}
                onClick={() =>
                  downloadCsv(
                    "habits_history.csv",
                    habitsHistory.map((d) => ({
                      date: d.date,
                      completed: d.completedCount,
                      total_habits: d.totalHabits,
                    })),
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
              <ExportButton
                label={t("insightsPage.exportLabelGoals", { days: rangeDays })}
                onClick={() =>
                  downloadCsv(
                    "goals_history.csv",
                    goalsHistory.map((d) => ({
                      date: d.date,
                      avg_progress: d.avgProgress,
                    })),
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
              <ExportButton
                label={t("insightsPage.exportLabelNutrition", { days: rangeDays })}
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
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
              <ExportButton
                label={t("insightsPage.exportLabelSupplements", { days: rangeDays })}
                onClick={() =>
                  downloadCsv(
                    "supplements_history.csv",
                    supplementsHistory.map((d) => ({
                      date: d.date,
                      taken: d.takenCount,
                      total_supplements: d.totalSupplements,
                    })),
                    t("insightsPage.exportEmptyAlert"),
                  )
                }
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

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
  onPointClick,
  fullWidth = false,
}: {
  label: string;
  color: string;
  data: { date: string; score: number }[];
  emptyMessage: string;
  height?: number;
  showLabel?: boolean;
  onPointClick?: (date: string) => void;
  fullWidth?: boolean;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(840);

  useEffect(() => {
    if (!fullWidth || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setMeasuredWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fullWidth]);

  const chartHeight = height;
  const padLeft = 26; // room for the y-axis value labels (0/50/100)
  const padRight = 12;
  const padTop = 10;
  const padBottom = 24; // room for date labels below the plot area
  const chartWidth = fullWidth ? measuredWidth : Math.max(280, data.length * 32);
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
    <div ref={containerRef}>
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
          style={{ width: "100%", maxWidth: fullWidth ? "none" : chartWidth, height: chartHeight, display: "block" }}
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
          {/* Hover targets brings to the section*/}
          :{points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={6}
              fill="transparent"
              onClick={onPointClick ? () => onPointClick(data[i].date) : undefined}
              style={onPointClick ? { cursor: "pointer" } : undefined}
              role={onPointClick ? "button" : undefined}
              tabIndex={onPointClick ? 0 : undefined}
              onKeyDown={
                onPointClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") onPointClick(data[i].date);
                    }
                  : undefined
              }
            >
              <title>
                {onPointClick
                  ? t("insightsPage.pointTooltipClickable", { date: data[i].date, score: data[i].score })
                  : t("insightsPage.pointTooltip", { date: data[i].date, score: data[i].score })}
              </title>
            </circle>
          ))}

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

// Short per-chart summary 
const STREAK_THRESHOLD = 70;

function getChartInsights(data: { date: string; score: number }[]) {
  if (data.length === 0) return null;
  let best = data[0];
  let worst = data[0];
  for (const d of data) {
    if (d.score > best.score) best = d;
    if (d.score < worst.score) worst = d;
  }
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].score >= STREAK_THRESHOLD) streak++;
    else break;
  }
  return { best, worst, streak };
}

function formatShortDate(date: string) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

function ChartInsights({ data }: { data: { date: string; score: number }[] }) {
  const { t } = useTranslation();
  const insights = getChartInsights(data);
  if (!insights) return null;
  return (
    <ul style={{ margin: "4px 0 0", padding: "0 0 0 16px", fontSize: 11.5, color: "#64748b", lineHeight: 1.6 }}>
      <li>
        {t("insightsPage.bestDay", { date: formatShortDate(insights.best.date), score: insights.best.score })}
      </li>
      <li>
        {t("insightsPage.lowestDay", { date: formatShortDate(insights.worst.date), score: insights.worst.score })}
      </li>
      <li>
        {insights.streak > 0
          ? t("insightsPage.streakActive", {
              days: insights.streak,
              dayWord: insights.streak === 1 ? t("insightsPage.dayUnitSingular") : t("insightsPage.dayUnitPlural"),
              threshold: STREAK_THRESHOLD,
            })
          : t("insightsPage.streakInactive", { threshold: STREAK_THRESHOLD })}
      </li>
    </ul>
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
  onPointClick,
}: {
  chartKey: string;
  label: string;
  color: string;
  data: { date: string; score: number }[];
  emptyMessage: string;
  onExpand: (key: string) => void;
  onExport: () => void;
  onPointClick?: (date: string) => void;
}) {
  const { t } = useTranslation();
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
            title={t("insightsPage.exportCsvTooltip")}
            aria-label={t("insightsPage.exportAriaLabel", { label })}
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
            title={t("insightsPage.expandTooltip")}
            aria-label={t("insightsPage.expandAriaLabel", { label })}
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
      <TrendChart label={label} color={color} data={data} emptyMessage={emptyMessage} showLabel={false} onPointClick={onPointClick} />
      <ChartInsights data={data} />
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