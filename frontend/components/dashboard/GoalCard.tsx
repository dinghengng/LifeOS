"use client";
import { Pencil, Trash2 } from "lucide-react";

export type Goal = {
  id: string;
  title: string;
  category: string;
  color: string;
  progress: number;
  dueDate: string;
  milestones: { label: string; done: boolean }[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export default function GoalCard({
  goal,
  onMilestoneToggle,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onMilestoneToggle: (goalId: string, milestoneIndex: number) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}) {
  const doneMilestones = goal.milestones.filter((m) => m.done).length;

  async function handleToggle(index: number) {
    // changed to make render appear immediately instead of needing to refresh
    onMilestoneToggle(goal.id, index);
  }

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: goal.color, display: "block", marginBottom: 2 }}>
            {goal.category}
          </span>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {goal.title}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
            Due {goal.dueDate}
          </span>
          <button
            onClick={() => onEdit(goal)}
            aria-label="Edit goal"
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
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            aria-label="Delete goal"
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
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Progress</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-primary)" }}>{goal.progress}%</span>
        </div>
        <div style={{ height: 6, background: "var(--color-background-secondary)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${goal.progress}%`, backgroundColor: goal.color, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Milestones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {goal.milestones.map((ms, i) => (
          <div
            key={i}
            onClick={() => handleToggle(i)}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: ms.done ? "var(--color-text-secondary)" : "var(--color-text-primary)", cursor: "pointer" }}
          >
            <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: ms.done ? goal.color : "transparent", border: ms.done ? "none" : "1.5px solid var(--color-border-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {ms.done && <span style={{ fontSize: 8, color: "#fff" }}>✓</span>}
            </div>
            <span style={{ textDecoration: ms.done ? "line-through" : "none" }}>{ms.label}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--color-text-secondary)" }}>
        {doneMilestones}/{goal.milestones.length} milestones complete
      </p>
    </div>
  );
}