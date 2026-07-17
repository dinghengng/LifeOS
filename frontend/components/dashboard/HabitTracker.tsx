"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import HabitRow, { Habit, getTodayIndexSGT, HABIT_GRID_COLUMNS, HABIT_GRID_GAP } from "./HabitRow";
import HabitHeatmap, { HeatmapDay } from "./HabitHeatmap";
import { useTranslation } from "../../context/LanguageContext";
import { TranslationKey } from "../../context/translations";


const CATEGORY_KEY_MAP: Record<string, TranslationKey> = {
  Fitness: "category.fitness",
  Spiritual: "category.spiritual",
  Relationship: "category.relationship",
  Career: "category.career",
  Finance: "category.finance",
};

export default function HabitTracker({
  habits,
  onToggleToday,
  onToggleSkip,
  onAddClick,
  onEditHabit,
  onDeleteHabit,
  getHabitHistory,
  bare = false,
}: {
  habits: Habit[];
  onToggleToday: (id: string) => void;
  onToggleSkip: (id: string) => void;
  onAddClick: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  getHabitHistory: (id: string) => Promise<HeatmapDay[]>;
  bare?: boolean;
}) {
  const { t } = useTranslation();
  const todayIndex = getTodayIndexSGT();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyCache, setHistoryCache] = useState<Record<string, HeatmapDay[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);

  const DAYS = [
    t("day.monday.short"),
    t("day.tuesday.short"),
    t("day.wednesday.short"),
    t("day.thursday.short"),
    t("day.friday.short"),
    t("day.saturday.short"),
    t("day.sunday.short")
  ];

  const categories = Array.from(
    new Set(habits.map((h) => h.category).filter((c): c is string => Boolean(c))),
  );
  const visibleHabits = activeCategory
    ? habits.filter((h) => h.category === activeCategory)
    : habits;

  async function handleToggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!historyCache[id]) {
      setHistoryLoading(id);
      const data = await getHabitHistory(id);
      setHistoryCache((prev) => ({ ...prev, [id]: data }));
      setHistoryLoading(null);
    }
  }

  const outerStyle = bare
    ? {}
    : {
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      };

  return (
    <div style={outerStyle}>
      {!bare && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {t("habitTracker.title")}
          </h2>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {activeCategory
              ? t("habitTracker.countInCategory", { count: visibleHabits.length, category: activeCategory })
              : t("habitTracker.countActive", { count: visibleHabits.length })}
          </span>
        </div>
      )}

      {categories.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: "4px 10px", borderRadius: 99, border: "1px solid var(--color-border-secondary)",
              background: activeCategory === null ? "#1e293b" : "transparent",
              color: activeCategory === null ? "#fff" : "var(--color-text-secondary)",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("habitTracker.filterAll")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "4px 10px", borderRadius: 99, border: "1px solid var(--color-border-secondary)",
                background: activeCategory === cat ? "#1e293b" : "transparent",
                color: activeCategory === cat ? "#fff" : "var(--color-text-secondary)",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              {/* 3. Apply translation to the category name */}
              {CATEGORY_KEY_MAP[cat] ? t(CATEGORY_KEY_MAP[cat]) : cat}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: HABIT_GRID_COLUMNS,
          gap: HABIT_GRID_GAP,
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", gridColumn: "1 / 3" }}>
          {/* spacer to keep day-of-week header aligned with rows below; title moved above */}
        </h2>
        {DAYS.map((d, i) => (
          <span
            key={i}
            style={{
              textAlign: "center", fontSize: 10,
              color: i === todayIndex ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: i === todayIndex ? 500 : 400,
            }}
          >
            {d}
          </span>
        ))}
        <span style={{ textAlign: "center", fontSize: 10, color: "var(--color-text-secondary)" }}>✓</span>
        <span style={{ textAlign: "center", fontSize: 10, color: "var(--color-text-secondary)" }}>💤</span>
        <div />
      </div>

      {habits.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 1rem", border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {t("habitTracker.emptyTitle")}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
            {t("habitTracker.emptyBody")}
          </p>
        </div>
      ) : visibleHabits.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "var(--color-text-secondary)", fontSize: 12, marginBottom: 12 }}>
          {t("habitTracker.emptyCategory", { category: activeCategory })}
        </div>
      ) : (
        visibleHabits.map((habit) => (
          <div key={habit.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => handleToggleExpand(habit.id)}
                aria-label={expandedId === habit.id ? t("habitTracker.collapseHeatmap") : t("habitTracker.showHeatmap")}
                title={t("habitTracker.historyTitle")}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", padding: 0, display: "flex", alignItems: "center" }}
              >
                {expandedId === habit.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <HabitRow
                  habit={habit}
                  onToggleToday={onToggleToday}
                  onToggleSkip={onToggleSkip}
                  onEdit={onEditHabit}
                  onDelete={onDeleteHabit}
                />
              </div>
            </div>
            {expandedId === habit.id && (
              <div style={{ padding: "4px 0 12px 20px" }}>
                {historyLoading === habit.id ? (
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>{t("habitTracker.loadingHistory")}</p>
                ) : (historyCache[habit.id]?.length ?? 0) > 0 ? (
                  <HabitHeatmap data={historyCache[habit.id]} habitColor={habit.color} />
                ) : (
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>{t("habitTracker.noHistory")}</p>
                )}
              </div>
            )}
          </div>
        ))
      )}

      <button
        onClick={onAddClick}
        style={{
          marginTop: 14, width: "100%", padding: "8px 0", fontSize: 13,
          color: "var(--color-text-secondary)", background: "transparent",
          border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer",
        }}
      >
        {t("habitTracker.addHabit")}
      </button>
    </div>
  );
}