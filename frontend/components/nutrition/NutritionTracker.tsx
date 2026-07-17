"use client";
import { SquarePen, Trash2 } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";

export type Meal = {
  id: string;
  mealName: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_name?: string; 
  meal_type?: string; 
};

interface NutritionTrackerProps {
  meals: Meal[];
  onAddMealClick: () => void;
  onEditMealClick: (meal: Meal) => void;
  onDeleteMealClick: (id: string) => void;
  calorieTarget: number;
  proteinTarget: number;
  fitnessGoal: string; // Add this
}

export default function NutritionTracker({
  meals,
  onAddMealClick,
  onEditMealClick,
  onDeleteMealClick,
  calorieTarget,
  proteinTarget,
  fitnessGoal,
}: NutritionTrackerProps) {
  const { t } = useTranslation();
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
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
            {t("nutritionTracker.title")}
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            {t("nutritionTracker.goalLabel")}{" "}
            <span style={{ color: "#4f46e5", textTransform: "capitalize" }}>
              {fitnessGoal.replace("_", " ")}
            </span>
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "var(--color-text-secondary)",
            }}
          >
            {t("nutritionTracker.itemsLoggedToday", { count: meals.length })}
          </p>
        </div>
        <button
          onClick={onAddMealClick}
          style={{
            padding: "6px 12px",
            backgroundColor: "#1D9E75",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {t("nutritionTracker.logMealBtn")}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              {t("nutritionTracker.dailyCalories")}
            </span>
            <span
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {t("nutritionTracker.caloriesProgress", { total: totalCalories, target: calorieTarget })}
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "var(--color-background-secondary, #f1f5f9)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min((totalCalories / calorieTarget) * 100, 100)}%`,
                backgroundColor: "#378ADD",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              {t("nutritionTracker.proteinTarget")}
            </span>
            <span
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {t("nutritionTracker.proteinProgress", { total: totalProtein, target: proteinTarget })}
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "var(--color-background-secondary, #f1f5f9)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min((totalProtein / proteinTarget) * 100, 100)}%`,
                backgroundColor: "#D85A30",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {meals.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderTop: "0.5px solid var(--color-border-tertiary)",
            paddingTop: "1.25rem",
          }}
        >
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {t("nutritionTracker.mealLogsHeader")}
          </h3>

          {meals.map((meal) => (
            <div
              key={meal.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "var(--color-background-secondary, #f8fafc)",
                borderRadius: "8px",
                border: "0.5px solid var(--color-border-tertiary)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {meal.mealName || meal.meal_name}
                </p>
                <span
                  style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
                >
                  {meal.mealType || meal.meal_type}
                </span>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span>
                    <strong style={{ color: "#D85A30", fontWeight: 600 }}>
                      {t("nutritionTracker.proteinShort")}
                    </strong>{" "}
                    {meal.protein}g
                  </span>
                  <span>
                    <strong style={{ color: "#EAB308", fontWeight: 600 }}>
                      {t("nutritionTracker.carbsShort")}
                    </strong>{" "}
                    {meal.carbs}g
                  </span>
                  <span>
                    <strong style={{ color: "#378ADD", fontWeight: 600 }}>
                      {t("nutritionTracker.fatsShort")}
                    </strong>{" "}
                    {meal.fats}g
                  </span>
                </div>

                <div
                  style={{
                    width: "1px",
                    height: "24px",
                    backgroundColor: "#e2e8f0",
                  }}
                />

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    textAlign: "right",
                    minWidth: "65px",
                  }}
                >
                  {t("nutritionTracker.kcalValue", { value: meal.calories })}
                </div>
                <button
                  onClick={() => onEditMealClick(meal)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={t("nutritionTracker.editMealTitle")}
                >
                  <SquarePen size={16} strokeWidth={2} />
                </button>
                <button onClick={() => onDeleteMealClick(meal.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#ef4444", display: "flex", alignItems: "center" }} title={t("nutritionTracker.deleteMealTitle")}>
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 0",
            borderTop: "0.5px solid var(--color-border-tertiary)",
            color: "var(--color-text-secondary)",
            fontSize: 13,
          }}
        >
          {t("nutritionTracker.emptyState")}
        </div>
      )}
    </div>
  );
}