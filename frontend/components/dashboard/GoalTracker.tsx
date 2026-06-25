"use client";

import { useState } from "react";
import GoalCard, { Goal } from "./GoalCard";

export default function GoalTracker({
  goals,
  onAddClick,
  onMilestoneToggle,
  onEditGoal,
  onDeleteGoal,
}: {
  goals: Goal[];
  onAddClick: () => void;
  onMilestoneToggle: (goalId: string, milestoneIndex: number) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(goals.map((g) => g.category)));
  const visibleGoals = activeCategory
    ? goals.filter((g) => g.category === activeCategory)
    : goals;

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
          marginBottom: "1rem",
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
          Goal tracker
        </h2>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {visibleGoals.length} {activeCategory ? `in ${activeCategory}` : "active"}
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

      {goals.length === 0 ? (
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
            No goals yet
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
            Set a long-term goal and break it into milestones to track your progress.
          </p>
        </div>
      ) : visibleGoals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "1.5rem 1rem",
            color: "var(--color-text-secondary)",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          No goals in {activeCategory} yet.
        </div>
      ) : (
        visibleGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onMilestoneToggle={onMilestoneToggle}
            onEdit={onEditGoal}
            onDelete={onDeleteGoal}
          />
        ))
      )}

      <button
        onClick={onAddClick}
        style={{
          marginTop: 2,
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
        + Add goal
      </button>
    </div>
  );
}