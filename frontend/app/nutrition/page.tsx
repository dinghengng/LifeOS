"use client"; //shift option f to format

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SquarePen, Trash2 } from "lucide-react";
import NutritionTracker, {
  Meal,
} from "../../components/nutrition/NutritionTracker";
import QuestPanel, { Quest } from "../../components/nutrition/QuestPanel";
import SupplementTracker, {
  Supplement,
} from "../../components/nutrition/SupplementTracker";
import { User } from "../../../shared/types";
import { checkAuthStatus, logoutUser } from "../../../shared/api";
import { UtensilsCrossed, Dumbbell, Target, Sunrise } from "lucide-react";
import NutritionChart, {
  DayData,
} from "../../components/nutrition/NutritionChart";
import { Lightbulb } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useToastContext } from "../../components/notifications/ToastContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const NUTRITION_QUOTES = [
  "Eat for the body you want, not the body you have.",
  "You can't out-train a bad diet.",
  "Food is fuel, not therapy.",
  "Strive for progress, not perfection.",
  "Your diet is a bank account. Good food choices are good investments.",
  "A year from now, you will wish you had started today.",
  "It's not a short-term diet. It's a long-term lifestyle change.",
  "Focus on how far you've come, not how far you have to go.",
  "Consistency beats intensity every single time.",
  "Your body is a reflection of your effort.",
  "Nutrition is the foundation of wellness.",
  "Small changes today, big results tomorrow.",
  "Fuel your body like you love it.",
  "Healthy habits create healthy lives.",
  "Every meal is a chance to nourish your body.",
  "Good nutrition is self-respect in action.",
  "What you eat today shapes your tomorrow.",
  "Discipline is choosing what you want most over what you want now.",
  "Strong bodies are built in the kitchen.",
  "Make food your ally, not your enemy.",
  "The best project you'll ever work on is yourself.",
  "Healthy eating is a form of self-care.",
  "Your future self is watching your choices today.",
  "Success starts with one healthy decision.",
  "A balanced diet fuels a balanced life.",
  "Take care of your body; it's the only place you have to live.",
  "Every healthy choice counts.",
  "Don't count calories, make calories count.",
  "Eat with purpose, live with energy.",
  "Wellness begins with what's on your plate.",
  "Healthy eating isn't a punishment, it's a privilege.",
  "Nourish your body and your mind will follow.",
  "Small improvements compound into big transformations.",
  "Choose foods that love you back.",
  "The secret ingredient is consistency.",
  "Good nutrition is the ultimate performance enhancer.",
  "Healthy eating is an investment, not an expense.",
  "Eat better, feel better, perform better.",
  "Your habits shape your health.",
  "Every bite is a vote for your future.",
  "The goal is progress, not perfection.",
  "Healthy choices become healthy habits.",
  "Feed your goals, not your cravings.",
  "Energy starts with nutrition.",
  "Results come from repeated healthy actions.",
  "Your body keeps score of your choices.",
  "Eat smart today, thrive tomorrow.",
  "Wellness is built one meal at a time.",
  "Healthy living starts with healthy eating.",
  "The strongest form of self-love is taking care of your health.",
]; //Quotes that randomly generate

function getDailyQuote() {
  const date = new Date();
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  return NUTRITION_QUOTES[dayOfYear % NUTRITION_QUOTES.length];
}

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
// 4 Quests for now , pending changes
function buildQuests(
  meals: Meal[],
  totalCalories: number,
  totalProtein: number,
  calorieTarget: number,
  proteinTarget: number,
): Quest[] {
  return [
    {
      id: "log_meals",
      label: "Fuel Up",
      description: "Log 3 or more meals today",
      xp: 20,
      icon: <UtensilsCrossed size={18} />,
      completed: meals.length >= 3,
    },
    {
      id: "hit_protein",
      label: "Protein Quest",
      description: `Hit your ${proteinTarget}g protein target`,
      xp: 30,
      icon: <Dumbbell size={18} />,
      completed: totalProtein >= proteinTarget,
    },
    {
      id: "calorie_ceiling",
      label: "Calorie Control",
      description: `Stay within your ${calorieTarget} kcal ceiling`,
      xp: 25,
      icon: <Target size={18} />,
      completed: totalCalories > 0 && totalCalories <= calorieTarget,
    },
    {
      id: "log_breakfast",
      label: "Early Bird",
      description: "Log a breakfast meal",
      xp: 15,
      icon: <Sunrise size={18} />,
      completed: meals.some(
        (m) => (m.mealType || m.meal_type || "").toLowerCase() === "breakfast",
      ),
    },
  ];
}
//manual craft insights but may change depending on scale of the free ai that can be used
function generateInsight(
  remainingCalories: number,
  remainingProtein: number,
  remainingCarbs: number,
  remainingFats: number,
  fitnessGoal: string,
  mealsLoggedToday: number,
  totalCalories: number,
): string {
  const goalLabel = fitnessGoal.replace("_", " ");

  // Hard over on calories
  if (remainingCalories < -300)
    return `You're ${Math.abs(remainingCalories)} kcal over today. Skip further snacks and close the day with a light, protein-rich dinner to limit the damage.`;
  // Slightly over for calories
  if (remainingCalories < 0 && remainingCalories >= -300)
    return `You're ${Math.abs(remainingCalories)} kcal over but not critical. A 20-minute walk burns roughly 100 kcal and helps with digestion too.`;
  // High protein gap but almost no calories left
  if (remainingProtein > 30 && remainingCalories < 300)
    return `${remainingProtein}g protein still needed but only ${remainingCalories} kcal left. A whey isolate shake (~120 kcal, 25g protein) or egg whites are your best options here.`;
  // Protein hit but more than 300 calories remaining
  if (remainingProtein <= 0 && remainingCalories > 300)
    return `Protein target nailed. You have ${remainingCalories} kcal left! use it on complex carbs like oats, sweet potato, or brown rice to fuel tomorrow's session.`;
  // Protein hit, calories nearly done too
  if (
    remainingProtein <= 0 &&
    remainingCalories <= 300 &&
    remainingCalories > 0
  )
    return `Almost perfect day! Protein done, ${remainingCalories} kcal to spare. A piece of fruit or a handful of nuts closes it out cleanly.`;
  // Fat is very high
  if (remainingFats < -15)
    return `Fat intake is running high today (${Math.abs(remainingFats)}g over). Keep your remaining meals lean. Grilled protein, vegetables, and skip any added oils or dressings.`;
  // Nothing logged yet
  if (mealsLoggedToday === 0)
    return `Nothing logged yet today. Start with a high-protein breakfast — eggs, Greek yoghurt, or a shake to front-load your ${goalLabel} targets and reduce evening cravings.`;
  // Under half calories by afternoon / evening
  if (totalCalories < remainingCalories * 0.4 && mealsLoggedToday >= 1)
    return `You've used less than half your calorie budget so far. Make sure you're eating enough — under-fuelling on a ${goalLabel} plan stalls progress just as much as overeating.`;
  // Carbs low for muscle gain
  if (fitnessGoal === "muscle_gain" && remainingCarbs > 100)
    return `You're ${remainingCarbs}g short on carbs. For muscle gain, carbs drive your training performance. Eat rice, pasta, or a banana before your next session would help.`;
  // Fat loss and on track
  if (
    fitnessGoal === "fat_loss" &&
    remainingCalories > 100 &&
    remainingProtein < 20
  )
    return `Great deficit day. Protein is nearly there, a small lean protein source at dinner keeps muscle preserved while you're in the cut.`;
  // All good
  return `You're on track for your ${goalLabel} goal. Keep your next meal balanced and you'll close today cleanly.`;
}

export default function NutritionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuppModal, setShowSuppModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"meals" | "supplements">("meals");
  const [activeRightTab, setActiveRightTab] = useState<"quests" | "progress">("quests");

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
  const [modalMode, setModalMode] = useState<
    "create" | "edit_log" | "edit_saved"
  >("create");
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [mealType, setMealType] = useState("Lunch");
  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFats, setMealFats] = useState("");
  const [saveToFavorites, setSaveToFavorites] = useState(false);

  // Supplements
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [checkedSupps, setCheckedSupps] = useState<Set<string>>(new Set());

  //Quests n Xp
  const [totalXP, setTotalXP] = useState(0);
  const [awardedQuestIds, setAwardedQuestIds] = useState<Set<string>>(
    new Set(),
  );
  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
  const totalFats = meals.reduce((s, m) => s + m.fats, 0); // these 4 for total used for insights
  const carbTarget = Math.round((targets.calories * 0.45) / 4);
  const fatTarget = Math.round((targets.calories * 0.25) / 9);

  const insight = generateInsight(
    targets.calories - totalCalories,
    targets.protein - totalProtein,
    carbTarget - totalCarbs,
    fatTarget - totalFats,
    metricsForm.goal,
    meals.length,
    totalCalories,
  ); // insights section

  const quests = buildQuests(
    meals,
    totalCalories,
    totalProtein,
    targets.calories,
    targets.protein,
  );

  const { showToast } = useToastContext();

  const [history, setHistory] = useState<DayData[]>([]);

  // Award XP when a quest first flips to completed; persist to backend
  useEffect(() => {
    let newXP = totalXP;
    const newIds = new Set(awardedQuestIds);
    let changed = false;

    quests.forEach((q) => {
      if (q.completed && !awardedQuestIds.has(q.id)) {
        newXP += q.xp;
        newIds.add(q.id);
        changed = true;
      }
    });

    if (changed) {
      setTotalXP(newXP);
      setAwardedQuestIds(newIds);
      showToast("Quest complete, XP earned", "success");
      fetch(`${API_BASE}/api/user/xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          total_xp: newXP,
          awarded_quest_ids: [...newIds],
        }),
      }).catch(console.error);
    }
  }, [quests]);

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
      const [logsRes, savedRes, metricsRes, suppsRes, xpRes, historyRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/nutrition`, { credentials: "include" }),
          fetch(`${API_BASE}/api/nutrition/saved`, { credentials: "include" }),
          fetch(`${API_BASE}/api/user/metrics`, { credentials: "include" }),
          fetch(`${API_BASE}/api/supplements`, { credentials: "include" }),
          fetch(`${API_BASE}/api/user/xp`, { credentials: "include" }),
          fetch(`${API_BASE}/api/nutrition/history?days=7`, {
            credentials: "include",
          }),
        ]);

      if (historyRes.ok) setHistory(await historyRes.json());
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
      // Supplements are optional so we won't throw if it fails, just log the error and continue
      if (suppsRes.ok) setSupplements(await suppsRes.json());
      if (xpRes.ok) {
        const xpData = await xpRes.json();
        setTotalXP(xpData.total_xp ?? 0);
        setAwardedQuestIds(new Set(xpData.awarded_quest_ids ?? []));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
      showToast("Failed to load nutrition data", "error");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchNutritionData();
  }, [authLoading, fetchNutritionData]);

  const handleToggleSupp = (key: string) => {
    setCheckedSupps((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleAddSupp = async (s: Omit<Supplement, "id">) => {
    try {
      const res = await fetch(`${API_BASE}/api/supplements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(s),
      });
      if (res.ok) {
        const created = await res.json();
        setSupplements((prev) => [...prev, created]);
        showToast("Supplement added", "success");
      } else {
        setSupplements((prev) => [...prev, { ...s, id: `temp-${Date.now()}` }]);
        showToast("Save failed.", "info");
      }
    } catch {
      setSupplements((prev) => [...prev, { ...s, id: `temp-${Date.now()}` }]);
      showToast("No connection", "info");
    }
  };

  const handleDeleteSupp = async (id: string | number) => {
    setSupplements((prev) => prev.filter((s) => s.id !== id));
    setCheckedSupps((prev) => {
      const next = new Set(prev);
      next.delete(`AM-${id}`);
      next.delete(`PM-${id}`);
      return next;
    });
    try {
      await fetch(`${API_BASE}/api/supplements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }
  };

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
        showToast("Targets saved", "success");
      } else {
        showToast("Failed to save targets", "error");
      }
    } catch (err) {
      console.error("Failed to save metrics", err);
      showToast("Something went wrong", "error");
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
      const res = await fetch(`${API_BASE}/api/nutrition/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) setMeals(meals.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Quick Add Meal
  const handleDeleteSaved = async (id: string | number | undefined) => {
    if (!id) return;
    if (!confirm("Are you sure you want to remove this from quick add?"))
      return;
    try {
      const res = await fetch(`${API_BASE}/api/nutrition/saved/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) setSavedMeals(savedMeals.filter((sm) => sm.id !== id));
    } catch (err) {
      console.error(err);
    }
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
            showToast("Meal logged and saved", "success");
          } else {
            showToast("Meal logged", "success");
          }
        } else if (modalMode === "edit_log") {
          const updatedMeal = await res.json();
          setMeals(meals.map((m) => (m.id === editingId ? updatedMeal : m)));
          showToast("Meal updated", "success");
        } else if (modalMode === "edit_saved") {
          fetchNutritionData(); // Refresh saved meals list to save changes
          showToast("Saved meal updated", "success");
        }

        setShowMealModal(false);
      } else {
        showToast("Failed to save meal", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong", "error");
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
          <Navbar onLogout={handleLogout} />
        </div>
      </div>

      {dataLoading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>
          Loading nutrition panel...
        </p>
      ) : (
        <div className="nutrition-grid">
          {/* Left column consisting of Meal Logging & Supplements */}
          <div className="nutrition-col">
            {/* Meals / Supplements tabbed card */}
            <div className="tracker-wrapper">
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  marginBottom: "1.25rem",
                  borderBottom: "1px solid var(--color-border-tertiary)",
                }}
              >
                <button
                  onClick={() => setActiveTab("meals")}
                  style={{
                    padding: "8px 4px",
                    marginRight: 20,
                    background: "none",
                    border: "none",
                    borderBottom:
                      activeTab === "meals"
                        ? "2px solid #1D9E75"
                        : "2px solid transparent",
                    color:
                      activeTab === "meals"
                        ? "var(--color-text-primary)"
                        : "#94a3b8",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    marginBottom: -1,
                  }}
                >
                  Meals
                </button>
                <button
                  onClick={() => setActiveTab("supplements")}
                  style={{
                    padding: "8px 4px",
                    background: "none",
                    border: "none",
                    borderBottom:
                      activeTab === "supplements"
                        ? "2px solid #1D9E75"
                        : "2px solid transparent",
                    color:
                      activeTab === "supplements"
                        ? "var(--color-text-primary)"
                        : "#94a3b8",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    marginBottom: -1,
                  }}
                >
                  Supplements
                </button>
              </div>

              {activeTab === "meals" ? (
                <NutritionTracker
                  meals={meals}
                  onAddMealClick={openCreateModal}
                  onEditMealClick={openEditLogModal}
                  onDeleteMealClick={handleDeleteLog}
                  calorieTarget={targets.calories}
                  proteinTarget={targets.protein}
                  fitnessGoal={metricsForm.goal}
                />
              ) : (
                <SupplementTracker
                  supplements={supplements}
                  checkedIds={checkedSupps}
                  onToggle={handleToggleSupp}
                  onAdd={handleAddSupp}
                  onDelete={handleDeleteSupp}
                />
              )}
            </div>


            {/* Daily Motivation Quote */}
            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: "2.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "1.5rem",
                }}
              >
                Quote of the Day
              </span>

              <div
                style={{
                  position: "relative",
                  padding: "0 1.5rem",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "-25px",
                    left: "-15px",
                    fontSize: "64px",
                    color: "#e2e8f0",
                    fontFamily: "Georgia, serif",
                    lineHeight: 1,
                  }}
                >
                  &ldquo;
                </span>

                <p
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1.4,
                    letterSpacing: "-0.5px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {getDailyQuote()}
                </p>

                <span
                  style={{
                    position: "absolute",
                    bottom: "-45px",
                    right: "-15px",
                    fontSize: "64px",
                    color: "#e2e8f0",
                    fontFamily: "Georgia, serif",
                    lineHeight: 1,
                  }}
                >
                  &rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* Right column - Quests & Progress */}
          <div className="nutrition-col">
            <div className="tracker-wrapper">
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  marginBottom: "1.25rem",
                  borderBottom: "1px solid var(--color-border-tertiary)",
                }}
              >
                <button
                  onClick={() => setActiveRightTab("quests")}
                  style={{
                    padding: "8px 4px",
                    marginRight: 20,
                    background: "none",
                    border: "none",
                    borderBottom:
                      activeRightTab === "quests"
                        ? "2px solid #1D9E75"
                        : "2px solid transparent",
                    color:
                      activeRightTab === "quests"
                        ? "var(--color-text-primary)"
                        : "#94a3b8",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    marginBottom: -1,
                  }}
                >
                  Quests
                </button>
                <button
                  onClick={() => setActiveRightTab("progress")}
                  style={{
                    padding: "8px 4px",
                    background: "none",
                    border: "none",
                    borderBottom:
                      activeRightTab === "progress"
                        ? "2px solid #1D9E75"
                        : "2px solid transparent",
                    color:
                      activeRightTab === "progress"
                        ? "var(--color-text-primary)"
                        : "#94a3b8",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    marginBottom: -1,
                  }}
                >
                  Progress
                </button>
              </div>

              {activeRightTab === "quests" ? (
                <QuestPanel quests={quests} totalXP={totalXP} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <NutritionChart
                    history={history}
                    calorieTarget={targets.calories}
                    proteinTarget={targets.protein}
                  />
                  {/* Insight section */}
                  <div
                    style={{
                      background: "var(--color-background-primary)",
                      border: "0.5px solid var(--color-border-tertiary)",
                      borderRadius: "var(--border-radius-lg)",
                      padding: "1rem 1.25rem",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <Lightbulb
                      size={18}
                      style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {insight}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>


          <style jsx>{`
            .nutrition-grid {
              max-width: 1280px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1.5rem;
              align-items: start;
            }
            .nutrition-col {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
            }
            .tracker-wrapper {
              background: var(--color-background-primary);
              border: 0.5px solid var(--color-border-tertiary);
              border-radius: var(--border-radius-lg);
              padding: 1.5rem;
            }

            @media (max-width: 900px) {
              .nutrition-grid {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
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
                <input
                  type="number"
                  min="20"
                  max="400"
                  step="0.1"
                  placeholder="e.g. 75"
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
                <input
                  type="number"
                  min="50"
                  max="270"
                  placeholder="e.g. 175"
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
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(sm.id)}
                        style={{
                          padding: "4px 8px 4px 2px",
                          fontSize: "11px",
                          border: "none",
                          background: "transparent",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
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