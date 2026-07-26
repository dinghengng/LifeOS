"use client";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";
import type { TranslationKey } from "../../context/translations";

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

const MONTH_INDEX: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

const CATEGORY_KEY_MAP: Record<string, TranslationKey> = {
  Fitness: "category.fitness",
  Spiritual: "category.spiritual",
  Relationship: "category.relationship",
  Career: "category.career",
  Finance: "category.finance",
};

function getTranslatedCategory(cat: string, t: (key: TranslationKey) => string): string {
  return CATEGORY_KEY_MAP[cat] ? t(CATEGORY_KEY_MAP[cat]) : cat;
}

const MONTH_KEY_MAP: Record<string, TranslationKey> = {
  January: "month.january",
  February: "month.february",
  March: "month.march",
  April: "month.april",
  May: "month.may",
  June: "month.june",
  July: "month.july",
  August: "month.august",
  September: "month.september",
  October: "month.october",
  November: "month.november",
  December: "month.december",
};

function formatDueDate(
  dueDate: string,
  locale: string,
  t: (key: TranslationKey) => string
): string {
  const match = dueDate.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match || !(match[1] in MONTH_KEY_MAP)) return dueDate;
  const monthLabel = t(MONTH_KEY_MAP[match[1]]);
  const year = match[2];
  return locale === "zh" ? `${year}年${monthLabel}` : `${monthLabel} ${year}`;
}

function getDaysUntilDue(dueDate: string): number | null {
  const match = dueDate.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match || !(match[1] in MONTH_INDEX)) return null;
  const due = new Date(Number(match[2]), MONTH_INDEX[match[1]] + 1, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getDueDateUrgencyColor(dueDate: string): string | undefined {
  const days = getDaysUntilDue(dueDate);
  if (days === null) return undefined;
  if (days < 30) return "#dc2626";
  if (days < 90) return "#d97706";
  return undefined;
}

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
  const { t, locale } = useTranslation();
  const doneMilestones = goal.milestones.filter((m) => m.done).length;
  const urgencyColor = getDueDateUrgencyColor(goal.dueDate);

  async function handleToggle(index: number) {
    onMilestoneToggle(goal.id, index);
  }

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: goal.color, display: "block", marginBottom: 2 }}>
            {getTranslatedCategory(goal.category, t)}
          </span>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {goal.title}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: urgencyColor || "var(--color-text-secondary)", fontWeight: urgencyColor ? 700 : 400, whiteSpace: "nowrap" }}>
            {t("goalCard.due", { date: formatDueDate(goal.dueDate, locale, t) })}
          </span>
          <button
            onClick={() => onEdit(goal)}
            aria-label={t("goalCard.editAria")}
            style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)" }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            aria-label={t("goalCard.deleteAria")}
            style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)" }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{t("goalCard.progress")}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-primary)" }}>{goal.progress}%</span>
        </div>
        <div style={{ height: 6, background: "var(--color-background-secondary)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${goal.progress}%`, backgroundColor: goal.color, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {goal.milestones.map((ms, i) => (
          <div
            key={i}
            onClick={() => handleToggle(i)}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: ms.done ? "var(--color-text-secondary)" : "var(--color-text-primary)", cursor: "pointer" }}
            onMouseEnter={(e) => {
              const dot = e.currentTarget.querySelector<HTMLDivElement>("[data-milestone-dot]");
              if (dot) dot.style.transform = "scale(1.15)";
            }}
            onMouseLeave={(e) => {
              const dot = e.currentTarget.querySelector<HTMLDivElement>("[data-milestone-dot]");
              if (dot) dot.style.transform = "scale(1)";
            }}
          >
            <div
              data-milestone-dot
              style={{
                width: 14, height: 14, borderRadius: "50%",
                backgroundColor: ms.done ? goal.color : "transparent",
                border: ms.done ? "none" : "2px solid #1e293b",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "transform 0.12s ease",
                boxShadow: ms.done ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              {ms.done && <span style={{ fontSize: 8, color: "#fff" }}>✓</span>}
            </div>
            <span style={{ textDecoration: ms.done ? "line-through" : "none" }}>{ms.label}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--color-text-secondary)" }}>
        {t("goalCard.milestonesComplete", { done: doneMilestones, total: goal.milestones.length })}
      </p>
    </div>
  );
}