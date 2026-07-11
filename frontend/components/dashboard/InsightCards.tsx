"use client";

import { useMemo } from "react";
import type { Habit } from "./HabitRow";
import type { Goal } from "./GoalCard";
import { getTodayIndexSGT } from "./HabitRow";

export type InsightTone = "celebrate" | "progress" | "nudge";

export type Insight = {
  id: string;
  emoji: string;
  text: string;
  tone: InsightTone;
};

const STREAK_MILESTONES = [7, 30, 100];
const MAX_CARDS = 4;

/**
 * Rule-based nudges derived entirely from habits + goals already in memory —
 * no extra fetch. Cheap enough to recompute on every render via useMemo.
 */
function generateInsights(habits: Habit[], goals: Goal[]): Insight[] {
  if (habits.length === 0 && goals.length === 0) {
    return [
      {
        id: "empty",
        emoji: "👋",
        text: "Add a habit or goal to start seeing insights here.",
        tone: "nudge",
      },
    ];
  }

  const insights: Insight[] = [];
  const todayIndex = getTodayIndexSGT();

  // Streak milestones already hit
  habits.forEach((h) => {
    if (STREAK_MILESTONES.includes(h.streak)) {
      insights.push({
        id: `streak-${h.id}`,
        emoji: "🔥",
        text: `${h.streak}-day streak on "${h.name}"!`,
        tone: "celebrate",
      });
    }
  });

  // Within striking distance of the next milestone
  habits.forEach((h) => {
    const next = STREAK_MILESTONES.find((m) => m > h.streak);
    const gap = next ? next - h.streak : 0;
    if (next && gap > 0 && gap <= 2) {
      insights.push({
        id: `near-${h.id}`,
        emoji: "⏳",
        text: `${gap} more day${gap === 1 ? "" : "s"} for a ${next}-day streak on "${h.name}"`,
        tone: "progress",
      });
    }
  });

  // Today's completion rate across all habits
  if (habits.length > 0) {
    const doneToday = habits.filter((h) => h.completedDays[todayIndex]).length;
    if (doneToday === habits.length) {
      insights.push({
        id: "all-done-today",
        emoji: "✅",
        text: `All ${habits.length} habit${habits.length === 1 ? "" : "s"} done today — nice work!`,
        tone: "celebrate",
      });
    } else if (doneToday > 0) {
      insights.push({
        id: "partial-today",
        emoji: "💪",
        text: `${doneToday}/${habits.length} habits done today — ${habits.length - doneToday} to go`,
        tone: "progress",
      });
    }
  }

  // Rest-day balance this week — framed as reassurance, never as shaming
  habits.forEach((h) => {
    const restDays = (h.skippedDays ?? []).filter(Boolean).length;
    if (restDays >= 3) {
      insights.push({
        id: `rest-${h.id}`,
        emoji: "🌿",
        text: `${restDays} rest days on "${h.name}" this week — consistency beats perfection`,
        tone: "nudge",
      });
    }
  });

  // Goals nearing or at completion
  goals.forEach((g) => {
    if (g.progress === 100) {
      insights.push({
        id: `goal-done-${g.id}`,
        emoji: "🏁",
        text: `"${g.title}" is complete!`,
        tone: "celebrate",
      });
    } else if (g.progress >= 75) {
      insights.push({
        id: `goal-near-${g.id}`,
        emoji: "🎯",
        text: `"${g.title}" is ${g.progress}% done — almost there`,
        tone: "progress",
      });
    }
  });

  // Combined streak across all habits hitting a round milestone
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  if (habits.length > 1 && STREAK_MILESTONES.includes(totalStreak)) {
    insights.push({
      id: "combined-streak",
      emoji: "⭐",
      text: `${totalStreak} combined streak days across all habits`,
      tone: "celebrate",
    });
  }

  // Celebratory first, then progress, then gentle nudges; cap the row
  const order: Record<InsightTone, number> = { celebrate: 0, progress: 1, nudge: 2 };
  return insights.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, MAX_CARDS);
}

const TONE_STYLES: Record<InsightTone, { bg: string; border: string }> = {
  celebrate: { bg: "#ecfdf5", border: "#6ee7b7" },
  progress: { bg: "#eff6ff", border: "#93c5fd" },
  nudge: { bg: "#fefce8", border: "#fde68a" },
};

export default function InsightCards({ habits, goals }: { habits: Habit[]; goals: Goal[] }) {
  const insights = useMemo(() => generateInsights(habits, goals), [habits, goals]);

  if (insights.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 2px 8px" }}>
      {insights.map((insight) => {
        const style = TONE_STYLES[insight.tone];
        return (
          <div
            key={insight.id}
            style={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: style.bg,
              border: `1px solid ${style.border}`,
              fontSize: 13,
              color: "#1e293b",
              maxWidth: 340,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{insight.emoji}</span>
            <span>{insight.text}</span>
          </div>
        );
      })}
    </div>
  );
}