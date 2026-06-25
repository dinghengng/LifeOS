"use client";

import { useState } from "react";
import HabitRow, { Habit, getTodayIndexSGT, HABIT_GRID_COLUMNS, HABIT_GRID_GAP } from "./HabitRow";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitTracker({
  habits,
  onToggleToday,
  onAddClick,
  onEditHabit,
  onDeleteHabit,
}: {
  habits: Habit[];
  onToggleToday: (id: string) => void;
  onAddClick: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
}) {
  const todayIndex = getTodayIndexSGT();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(habits.map((h) => h.category).filter((c): c is string => Boolean(c))),
  );
  const visibleHabits = activeCategory
    ? habits.filter((h) => h.category === activeCategory)
    : habits;

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            color: "var(--color-text-primary)",
          }}
        >
          Habit tracker
        </h2>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {visibleHabits.length} {activeCategory ? `in ${activeCategory}` : "active"}
        </span>
      </div>

      {categories.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: "4px 10px",
              borderRadius: 99,
              border: "1px solid var(--color-border-secondary)",
              background: activeCategory === null ? "#1e293b" : "transparent",
              color: activeCategory === null ? "#fff" : "var(--color-text-secondary)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "4px 10px",
                borderRadius: 99,
                border: "1px solid var(--color-border-secondary)",
                background: activeCategory === cat ? "#1e293b" : "transparent",
                color: activeCategory === cat ? "#fff" : "var(--color-text-secondary)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {cat}
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
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            gridColumn: "1 / 3",
          }}
        >
          {/* spacer to keep day-of-week header aligned with rows below; title moved above */}
        </h2>
        {DAYS.map((d, i) => (
          <span
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: i === todayIndex ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: i === todayIndex ? 500 : 400,
            }}
          >
            {d}
          </span>
        ))}
        <span style={{ textAlign: "center", fontSize: 10, color: "var(--color-text-secondary)" }}>✓</span>
        <div />
      </div>

      {habits.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            border: "0.5px dashed var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            marginBottom: 12,
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
            No habits yet
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
            Add your first habit to start building your streak.
          </p>
        </div>
      ) : visibleHabits.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "1.5rem 1rem",
            color: "var(--color-text-secondary)",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          No habits in {activeCategory} yet.
        </div>
      ) : (
        visibleHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            onToggleToday={onToggleToday}
            onEdit={onEditHabit}
            onDelete={onDeleteHabit}
          />
        ))
      )}

      <button
        onClick={onAddClick}
        style={{
          marginTop: 14,
          width: "100%",
          padding: "8px 0",
          fontSize: 13,
          color: "var(--color-text-secondary)",
          background: "transparent",
          border: "0.5px dashed var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          cursor: "pointer",
        }}
      >
        + Add habit
      </button>
    </div>
  );
}