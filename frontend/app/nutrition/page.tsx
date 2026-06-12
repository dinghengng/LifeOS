"use client"; //shift option f to format

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SquarePen, Trash2 } from "lucide-react";
import NutritionTracker, { Meal } from "../../components/nutrition/NutritionTracker";
import { User } from "../../../shared/types";
import { checkAuthStatus, logoutUser } from "../../../shared/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

type SavedMeal = {
  id?: number | string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealName?: string;
  meal_name?: string;
  mealType?: string;
  meal_type?: string; //db and frontend naming inconsistencies 
};

export default function NutritionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Macro optimization depends on like the user height and weight + goals
  const [targets, setTargets] = useState({ calories: 2300, protein: 140 });
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [metricsForm, setMetricsForm] = useState({
    weight: "",
    height: "",
    goal: "muscle_gain",
  });

  // Modal configuration states
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealName, setMealName] = useState("");
  const [modalMode, setModalMode] = useState< "create" | "edit_log" | "edit_saved">("create");
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [mealType, setMealType] = useState("Lunch");
  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFats, setMealFats] = useState("");
  const [saveToFavorites, setSaveToFavorites] = useState(false);

  // Target calculation
  const calculateTargets = (weight: number, goal: string) => {
    if (!weight) return;
    // Base Metabolic 
    let calcCalories = Math.round(weight * 24 * 1.2);
    // Protein Calculation abt 1.5g per kg of bodyweight for optimal muscle gain
    let calcProtein = Math.round(weight * 1.5);
    // Goal adjustments
    if (goal === "muscle_gain") calcCalories += 300;
    if (goal === "fat_loss") calcCalories -= 300;
    setTargets({ calories: calcCalories, protein: calcProtein });
  };

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    };
    init();
  }, [router]);

  const fetchNutritionData = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [logsRes, savedRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE}/api/nutrition`, { credentials: "include" }),
        fetch(`${API_BASE}/api/nutrition/saved`, { credentials: "include" }),
        fetch(`${API_BASE}/api/user/metrics`, { credentials: "include" }),
      ]);

      if (!logsRes.ok) throw new Error("Nutrition logs fetch failed");

      setMeals(await logsRes.json());
      if (savedRes.ok) setSavedMeals(await savedRes.json());

      if (metricsRes.ok) {
        const userMetrics = await metricsRes.json();
        // Pre-fill form if data exists
        setMetricsForm({
          weight: userMetrics.weight_kg || "",
          height: userMetrics.height_cm || "",
          goal: userMetrics.fitness_goal || "maintain",
        });

        // Show popup if weight OR height is missing
        if (!userMetrics.weight_kg || !userMetrics.height_cm) {
          setShowMetricsModal(true);
        } else {
          calculateTargets(
            parseFloat(userMetrics.weight_kg),
            userMetrics.fitness_goal,
          );
          setShowMetricsModal(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchNutritionData();
  }, [authLoading, fetchNutritionData]);

  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/user/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          weight_kg: parseFloat(metricsForm.weight) || null, // Allow nulls if skipped
          height_cm: parseFloat(metricsForm.height) || null,
          fitness_goal: metricsForm.goal,
        }),
      });

      if (res.ok) {
        if (metricsForm.weight) {
          calculateTargets(parseFloat(metricsForm.weight), metricsForm.goal);
        }
        setShowMetricsModal(false);
      }
    } catch (err) {
      console.error("Failed to save metrics", err);
    }
  };

  // Pop up for meal logging and editing
  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setMealName("");
    setMealType("Lunch");
    setMealCalories("");
    setMealProtein("");
    setMealCarbs("");
    setMealFats("");
    setSaveToFavorites(false);
    setShowMealModal(true);
  };

  const openEditLogModal = (meal: Meal) => {
    setModalMode("edit_log");
    setEditingId(meal.id);
    setMealName(meal.mealName || meal.meal_name || "");
    setMealType(meal.mealType || meal.meal_type || "Lunch");
    setMealCalories(meal.calories.toString());
    setMealProtein(meal.protein.toString());
    setMealCarbs(meal.carbs.toString());
    setMealFats(meal.fats.toString());
    setShowMealModal(true);
  };

  const openEditSavedModal = (meal: SavedMeal) => {
    setModalMode("edit_saved");
    setEditingId(meal.id || null);
    setMealName(meal.mealName || meal.meal_name || "");
    setMealType(meal.mealType || meal.meal_type || "Lunch");
    setMealCalories(meal.calories.toString());
    setMealProtein(meal.protein.toString());
    setMealCarbs(meal.carbs.toString());
    setMealFats(meal.fats.toString());
    setShowMealModal(true);
  };

  const handleQuickAddSelect = (meal: SavedMeal) => {
    setMealName(meal.mealName || meal.meal_name || "");
    setMealType(meal.mealType || meal.meal_type || "Lunch");
    setMealCalories(meal.calories.toString());
    setMealProtein(meal.protein.toString());
    setMealCarbs(meal.carbs.toString());
    setMealFats(meal.fats.toString());
    setSaveToFavorites(false);
  };

  // Delete Daily Log
  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal log?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/nutrition/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setMeals(meals.filter(m => m.id !== id));
    } catch (err) { console.error(err); }
  };

  // Delete Quick Add Meal
  const handleDeleteSaved = async (id: string | number | undefined) => {
    if (!id) return;
    if (!confirm("Are you sure you want to remove this from quick add?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/nutrition/saved/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setSavedMeals(savedMeals.filter(sm => sm.id !== id));
    } catch (err) { console.error(err); }
  };

  // Master Form Submit handling Create AND Editing
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mealName.trim()) return;

    const payload = {
      mealName,
      mealType,
      calories: parseInt(mealCalories) || 0,
      protein: parseInt(mealProtein) || 0,
      carbs: parseInt(mealCarbs) || 0,
      fats: parseInt(mealFats) || 0,
    };

    try {
      const method = modalMode === "create" ? "POST" : "PATCH";
      const endpoint =
        modalMode === "create"
          ? `${API_BASE}/api/nutrition`
          : modalMode === "edit_log"
            ? `${API_BASE}/api/nutrition/${editingId}`
            : `${API_BASE}/api/nutrition/saved/${editingId}`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (modalMode === "create") {
          const newMeal = await res.json();
          setMeals([...meals, newMeal]);

          if (saveToFavorites) {
            await fetch(`${API_BASE}/api/nutrition/saved`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            });
            fetchNutritionData(); // Refresh saved meals list to save changes
          }
        } else if (modalMode === "edit_log") {
          const updatedMeal = await res.json();
          setMeals(meals.map((m) => (m.id === editingId ? updatedMeal : m)));
        } else if (modalMode === "edit_saved") {
          fetchNutritionData(); // Refresh saved meals list to save changes
        }

        setShowMealModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
    router.push("/");
  };

  const today = new Date().toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background-tertiary,#f5f5f2)]">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    color: "#1e293b",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background-tertiary, #f5f5f2)",
        fontFamily: "var(--font-sans)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "2rem",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            {today}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Health & Nutrition
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Tasks
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/journal")}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Journal
          </button>
          <button
            onClick={() => router.push("/nutrition")}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid #4f46e5",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Nutrition
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
          <button
            onClick={() => setShowMetricsModal(true)}
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
            }}
          >
            Edit Goals
          </button>
        </div>
      </div>

      {dataLoading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>
          Loading nutrition panel...
        </p>
      ) : (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <NutritionTracker
            meals={meals}
            onAddMealClick={openCreateModal}
            onEditMealClick={openEditLogModal}
            onDeleteMealClick={handleDeleteLog}
            calorieTarget={targets.calories}
            proteinTarget={targets.protein}
            fitnessGoal={metricsForm.goal}
          />
        </div>
      )}

      {/* Pop-up Profile Metrics */}
      {showMetricsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleSaveMetrics}
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "400px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div>
              <h3
                style={{
                  margin: "0 0 4px 0",
                  color: "#1e293b",
                  fontSize: "20px",
                }}
              >
                Personalize Your Goals
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Let's tailor your calorie and protein targets to your exact body
                metrics. (Optional)
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Weight (kg)
                </label>
                {/* Removed required tag to make it optional */}
                <input
                  type="number"
                  step="0.1"
                  value={metricsForm.weight}
                  onChange={(e) =>
                    setMetricsForm({ ...metricsForm, weight: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Height (cm)
                </label>
                {/* make it optional so users arent forced*/}
                <input
                  type="number"
                  value={metricsForm.height}
                  onChange={(e) =>
                    setMetricsForm({ ...metricsForm, height: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Primary Goal
              </label>
              <select
                value={metricsForm.goal}
                onChange={(e) =>
                  setMetricsForm({ ...metricsForm, goal: e.target.value })
                }
                style={inputStyle}
              >
                <option value="maintain">Maintain Current Weight</option>
                <option value="muscle_gain">
                  Build Muscle (Caloric Surplus)
                </option>
                <option value="fat_loss">Lose Fat (Caloric Deficit)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Skip for now
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Targets
              </button>
            </div>
          </form>
        </div>
      )}

      {showMealModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowMealModal(false)}
        >
          <form
            onSubmit={handleFormSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "420px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>
              {modalMode === "create"
                ? "Log New Meal"
                : modalMode === "edit_log"
                  ? "Edit Logged Meal"
                  : "Edit Saved Meal"}
            </h3>

            {/* Quick Add Section */}
            {modalMode === "create" && savedMeals.length > 0 && (
              <div style={{ marginBottom: "4px" }}>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  Quick Add
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                  }}
                >
                  {savedMeals.map((sm) => (
                    <div
                      key={sm.id}
                      style={{
                        display: "flex",
                        flexShrink: 0,
                        alignItems: "center",
                        border: "1px solid #cbd5e1",
                        borderRadius: "99px",
                        backgroundColor: "#f8fafc",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleQuickAddSelect(sm)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "13px",
                          border: "none",
                          background: "transparent",
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        {sm.meal_name || sm.mealName}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditSavedModal(sm)}
                        style={{
                          padding: "4px 8px 4px 0",
                          border: "none",
                          background: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Edit Quick Add"
                      >
                        <SquarePen size={14} strokeWidth={2} />
                      </button>
                      <button type="button" onClick={() => handleDeleteSaved(sm.id)} style={{ padding: "4px 8px 4px 2px", fontSize: "11px", border: "none", background: "transparent", color: "#ef4444", cursor: "pointer" }}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="Meal Name (e.g., Chicken Rice)"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              style={inputStyle}
              required
            />
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              style={inputStyle}
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                width: "100%",
              }}
            >
              <input
                type="number"
                placeholder="Calories (kcal)"
                value={mealCalories}
                onChange={(e) => setMealCalories(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Protein (g)"
                value={mealProtein}
                onChange={(e) => setMealProtein(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={mealCarbs}
                onChange={(e) => setMealCarbs(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Fats (g)"
                value={mealFats}
                onChange={(e) => setMealFats(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* for quick add */}
            {modalMode === "create" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#475569",
                  cursor: "pointer",
                  marginTop: "4px",
                }}
              >
                <input
                  type="checkbox"
                  checked={saveToFavorites}
                  onChange={(e) => setSaveToFavorites(e.target.checked)}
                />
                Save this meal to favorites for quick add
              </label>
            )}

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setShowMealModal(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "white",
                  color: "#1e293b",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#1D9E75",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {modalMode === "create" ? "Save" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}