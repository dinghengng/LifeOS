"use client";

import { type ReactNode } from "react";

export type Quest = {
  id: string;
  label: string;
  description: string;
  xp: number;
  completed: boolean;
  icon: ReactNode;
};
interface QuestPanelProps {
  quests: Quest[];
  totalXP: number;
}

const XP_PER_LEVEL = 100;

function getLevelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXP = xp % XP_PER_LEVEL;
  const progress = (currentLevelXP / XP_PER_LEVEL) * 100;
  const titles = [
    "Newcomer",
    "Initiate",
    "Apprentice",
    "Practitioner",
    "Adept",
    "Expert",
    "Master",
    "Champion",
    "Legend",
    "Ascendant",
  ];
  return {
    level,
    currentLevelXP,
    progress,
    title: titles[Math.min(level - 1, titles.length - 1)],
  };
}

const QUEST_COLOR = "#1D9E75";

const QuestCheckbox = ({ completed }: { completed: boolean }) => (
  <div
    style={{
      width: 18,
      height: 18,
      borderRadius: 5,
      flexShrink: 0,
      border: `2px solid ${completed ? QUEST_COLOR : "#cbd5e1"}`,
      background: completed ? QUEST_COLOR : "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    }}
  >
    {completed && (
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path
          d="M1 4l2.5 2.5L9 1"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </div>
);

export default function QuestPanel({ quests, totalXP }: QuestPanelProps) {
  const { level, currentLevelXP, progress, title } = getLevelInfo(totalXP);
  const completedCount = quests.filter((q) => q.completed).length;

  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 500,
              color: "var(--color-text-primary)",
            }}
          >
            Daily Quests
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            {completedCount}/{quests.length} completed today
          </p>
        </div>

        {/* XP n user level */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="36"
                cy="36"
                r={r}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="5"
              />
              <circle
                cx="36"
                cy="36"
                r={r}
                fill="none"
                stroke={QUEST_COLOR}
                strokeWidth="5"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  lineHeight: 1,
                }}
              >
                {level}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "#64748b",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                LVL
              </span>
            </div>
          </div>

          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {title}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
              {currentLevelXP} / {XP_PER_LEVEL} XP
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 11,
                color: QUEST_COLOR,
                fontWeight: 600,
              }}
            >
              {totalXP} XP total
            </p>
          </div>
        </div>
      </div>

      {/* Quest list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {quests.map((quest) => (
          <div
            key={quest.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: `0.5px solid ${quest.completed ? "#bbf7d0" : "var(--color-border-tertiary)"}`,
              background: quest.completed
                ? "#f0fdf4"
                : "var(--color-background-secondary, #f8fafc)",
              transition: "all 0.3s ease",
            }}
          >
            <QuestCheckbox completed={quest.completed} />

            <span
              style={{
                color: quest.completed ? QUEST_COLOR : "#94a3b8",
                transition: "color 0.2s ease",
                display: "flex",
                flexShrink: 0,
              }}
            >
              {quest.icon}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: quest.completed
                    ? "#15803d"
                    : "var(--color-text-primary)",
                  textDecoration: quest.completed ? "line-through" : "none",
                  opacity: quest.completed ? 0.7 : 1,
                }}
              >
                {quest.label}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: "#64748b" }}>
                {quest.description}
              </p>
            </div>

            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 99,
                background: quest.completed ? "#dcfce7" : "#f1f5f9",
                color: quest.completed ? "#16a34a" : "#64748b",
                flexShrink: 0,
              }}
            >
              +{quest.xp} XP
            </span>
          </div>
        ))}
      </div>

      {completedCount === quests.length && quests.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${QUEST_COLOR} 0%, #059669 100%)`,
            textAlign: "center",
          }}
        >
          <p
            style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white" }}
          >
            All quests complete! You earned{" "}
            {quests.reduce((s, q) => s + q.xp, 0)} XP today.
          </p>
        </div>
      )}
    </div>
  );
}