"use client";

import { Pencil, Trash2 } from "lucide-react";

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  category?: string;
  streak: number;
  totalDays?: number;
  completedDays: boolean[]; // index 0 = Monday ... index 6 = Sunday, current week using SGT
};

export const HABIT_GRID_COLUMNS = "28px 1fr repeat(7, 18px) 28px 50px";
export const HABIT_GRID_GAP = 6;

export function getSGTDate(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(year, month - 1, day);
}

export function getTodayIndexSGT(): number {
  const jsDay = getSGTDate().getDay(); // 0 = Sunday ... 6 = Saturday
  return (jsDay + 6) % 7;
}

export default function HabitRow({
  habit,
  onToggleToday,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  onToggleToday: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}) {
  const todayIndex = getTodayIndexSGT();
  const todayDone = habit.completedDays[todayIndex];
  const sgtToday = getSGTDate();
  const daysSoFar = todayIndex + 1; // only count days up to and including today
  const completedSoFar = habit.completedDays.slice(0, daysSoFar).filter(Boolean).length;
  const weeklyPct = daysSoFar > 0 ? Math.round((completedSoFar / daysSoFar) * 100) : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: HABIT_GRID_COLUMNS,
        gap: HABIT_GRID_GAP,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}
    >
      <span style={{ fontSize: 20, textAlign: "center" }}>{habit.icon}</span>

      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {habit.name}
        </p>
       
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Streak</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: habit.streak > 0 ? "#f97316" : "var(--color-text-secondary)" }}>
              🔥 {habit.streak}
            </span>
          </div>
          <span
            style={{
              display: "block",
              width: 0,
              minWidth: 0,
              height: 22,
              minHeight: 22,
              borderLeft: "1.5px solid #000000",
              flexShrink: 0,
              alignSelf: "center",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: (habit.totalDays || 0) > 0 ? "#eab308" : "var(--color-text-secondary)" }}>
              ⭐ {habit.totalDays || 0}
            </span>
          </div>
          <span
            style={{
              display: "block",
              width: 0,
              minWidth: 0,
              height: 22,
              minHeight: 22,
              borderLeft: "1.5px solid #000000",
              flexShrink: 0,
              alignSelf: "center",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>This wk</span>
            <span
              title={`${completedSoFar} of ${daysSoFar} day${daysSoFar === 1 ? "" : "s"} completed so far this week (Mon–today)`}
              style={{ fontSize: 11, fontWeight: 600, color: weeklyPct >= 70 ? "#1D9E75" : weeklyPct >= 40 ? "#eab308" : "var(--color-text-secondary)" }}
            >
              {completedSoFar}/{daysSoFar}
            </span>
          </div>
        </div>
      </div>

      {/* 7 day cells for the current week */}
      {habit.completedDays.map((done, i) => {
        const targetDate = new Date(sgtToday);
        targetDate.setDate(targetDate.getDate() + (i - todayIndex));
        const dayLabel = targetDate.toLocaleDateString("en-SG", {
          weekday: "long",
        });

        return (
          <div
            key={i}
            title={dayLabel}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              backgroundColor: done
                ? habit.color
                : "var(--color-background-secondary)",
              border: done
                ? "none"
                : i === todayIndex
                  ? "1.5px solid #94a3b8"
                  : "0.5px solid var(--color-border-secondary)",
              opacity: i === todayIndex ? 1 : 0.8,
            }}
          />
        );
      })}
      <button
        onClick={() => onToggleToday(habit.id)}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: todayDone
            ? "2px solid #000000"
            : "2px solid #1e293b",
          backgroundColor: todayDone ? habit.color : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: todayDone ? "#fff" : "#1e293b",
          transition: "all 0.15s ease",
          boxShadow: todayDone
            ? "0 0 0 2px " + habit.color + "33"
            : "0 1px 2px rgba(0,0,0,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        aria-label={todayDone ? "Mark incomplete" : "Mark complete"}
      >
        {todayDone ? "✓" : ""}
      </button>
      {/* Edit / Delete actions */}
      <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <button
          onClick={() => onEdit(habit)}
          aria-label="Edit habit"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-secondary)",
          }}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          aria-label="Delete habit"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-secondary)",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}