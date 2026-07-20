"use client";

import { useState } from "react";
import GoalCard, { Goal } from "./GoalCard";
import { useTranslation } from "../../context/LanguageContext";
import { TranslationKey } from "../../context/translations";


const CATEGORY_KEY_MAP: Record<string, TranslationKey> = {
  Fitness: "category.fitness",
  Spiritual: "category.spiritual",
  Relationship: "category.relationship",
  Career: "category.career",
  Finance: "category.finance",
};

export default function GoalTracker({
  goals,
  onAddClick,
  onMilestoneToggle,
  onEditGoal,
  onDeleteGoal,
  bare = false,
}: {
  goals: Goal[];
  onAddClick: () => void;
  onMilestoneToggle: (goalId: string, milestoneIndex: number) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  bare?: boolean;
}) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const pendingGoal = goals.find((g) => g.id === confirmDeleteId) ?? null;

  const confirmDelete = () => {
    if (confirmDeleteId === null) return;
    onDeleteGoal(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const categories = Array.from(new Set(goals.map((g) => g.category)));
  const visibleGoals = activeCategory
    ? goals.filter((g) => g.category === activeCategory)
    : goals;

  const outerStyle = bare
    ? {}
    : {
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      };

  // Helper to translate category names safely
  const getTranslatedCategory = (cat: string) => {
    return CATEGORY_KEY_MAP[cat] ? t(CATEGORY_KEY_MAP[cat]) : cat;
  };

  return (
    <div style={outerStyle}>
      {/*Delete confirmation modal */}
      {confirmDeleteId !== null && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", padding: 16,
        }}>
          <div style={{
            background: "white", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            maxWidth: 360, width: "100%", padding: 20,
          }}>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#334155" }}>
              {t("goalTracker.confirmDeleteGoal", { title: pendingGoal?.title ?? "" })}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  fontSize: 12, padding: "6px 12px", borderRadius: 8,
                  border: "0.5px solid var(--color-border-tertiary)",
                  background: "white", color: "#475569", cursor: "pointer",
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  fontSize: 12, padding: "6px 12px", borderRadius: 8,
                  border: "1px solid #fca5a5", background: "#fef2f2",
                  color: "#dc2626", cursor: "pointer", fontWeight: 600,
                }}
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
      {!bare && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {t("goalTracker.title")}
          </h2>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {activeCategory
              ? t("goalTracker.countInCategory", { 
                  count: visibleGoals.length, 
                  category: getTranslatedCategory(activeCategory) 
                })
              : t("goalTracker.countActive", { count: visibleGoals.length })}
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
            {t("goalTracker.filterAll")}
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
              {/* 2. Apply translation to the category name */}
              {getTranslatedCategory(cat)}
            </button>
          ))}
        </div>
      )}

      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 1rem", border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {t("goalTracker.emptyTitle")}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
            {t("goalTracker.emptyBody")}
          </p>
        </div>
      ) : visibleGoals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "var(--color-text-secondary)", fontSize: 12, marginBottom: 12 }}>
          {t("goalTracker.emptyCategory", { 
            category: activeCategory ? getTranslatedCategory(activeCategory) : "" 
          })}
        </div>
      ) : (
        visibleGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onMilestoneToggle={onMilestoneToggle}
            onEdit={onEditGoal}
            onDelete={(goalId: string) => setConfirmDeleteId(goalId)}
          />
        ))
      )}

      <button
        onClick={onAddClick}
        style={{
          marginTop: 2, width: "100%", padding: "8px 0", fontSize: 13,
          color: "var(--color-text-secondary)", background: "transparent",
          border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer",
        }}
      >
        {t("goalTracker.addGoal")}
      </button>
    </div>
  );
}