"use client";
import { SquarePen, Trash2 } from "lucide-react";

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
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);

  return (
    <div
      style={{
        background: "var(--color-background-primary, #ffffff)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
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
            Nutrition Tracker
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            Goal:{" "}
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
            {meals.length} items logged today
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
          + Log Meal
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
              Daily Calories
            </span>
            <span
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {totalCalories} / {calorieTarget} kcal
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
              Protein Target
            </span>
            <span
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {totalProtein} / {proteinTarget}g
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
            Meal Logs
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
                      Protein:
                    </strong>{" "}
                    {meal.protein}g
                  </span>
                  <span>
                    <strong style={{ color: "#EAB308", fontWeight: 600 }}>
                      Carbs:
                    </strong>{" "}
                    {meal.carbs}g
                  </span>
                  <span>
                    <strong style={{ color: "#378ADD", fontWeight: 600 }}>
                      Fats:
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
                  {meal.calories} kcal
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
                  title="Edit Meal"
                >
                  <SquarePen size={16} strokeWidth={2} />
                </button>
                <button onClick={() => onDeleteMealClick(meal.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#ef4444", display: "flex", alignItems: "center" }} title="Delete Meal">
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
          No meals logged yet for today. Track your first meal to get started!
        </div>
      )}
    </div>
  );
}