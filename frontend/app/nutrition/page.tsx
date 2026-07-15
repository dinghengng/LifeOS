"use client"; //shift option f to format

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SquarePen, Trash2, AlertCircle, Lightbulb } from "lucide-react";
import NutritionTracker, {
  Meal,
} from "../../components/nutrition/NutritionTracker";
import QuestPanel, { Quest } from "../../components/nutrition/QuestPanel";
import SupplementTracker, {
  Supplement,
} from "../../components/nutrition/SupplementTracker";
import { checkAuthStatus, logoutUser } from "../../../shared/api";
import { UtensilsCrossed, Dumbbell, Target, Sunrise } from "lucide-react";
import NutritionChart, {
  DayData,
} from "../../components/nutrition/NutritionChart";
import { BsUpcScan } from "react-icons/bs";
import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";
import DailyQuoteCard from "../../components/nutrition/DailyQuoteCard";
import LocalTabs from "../../components/layout/LocalTabs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

// Backend returns snake_case columns, then frontend Supplement type expects camelCase. Normalize once here so every call site gets a consistent shape.
function normalizeSupplement(raw: any): Supplement {
  return {
    ...raw,
    supplyCount: raw.supply_count ?? raw.supplyCount,
    dailyDose: raw.daily_dose ?? raw.dailyDose,
    supplyUnit: raw.supply_unit ?? raw.supplyUnit,
  };
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
  const [authLoading, setAuthLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"tracker" | "insights">("tracker");

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
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Supplements
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [checkedSupps, setCheckedSupps] = useState<Set<string>>(new Set());
  const [suppError, setSuppError] = useState<string | null>(null);

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
      if (suppsRes.ok) {
        const suppsData = (await suppsRes.json()).map(normalizeSupplement);
        setSupplements(suppsData);
        setCheckedSupps((prev) => {
          const next = new Set(prev);
          suppsData.forEach((s: any) => {
            if (s.takenToday) {
              if (s.timing === "AM" || s.timing === "Both")
                next.add(`AM-${s.id}`);
              if (s.timing === "PM" || s.timing === "Both")
                next.add(`PM-${s.id}`);
            }
          });
          return next;
        });
      }

      if (xpRes.ok) {
        const xpData = await xpRes.json();
        setTotalXP(xpData.total_xp ?? 0);
        setAwardedQuestIds(new Set(xpData.awarded_quest_ids ?? []));
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

  const handleToggleSupp = async (key: string) => {
    setCheckedSupps((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

    // Extract the supplement id from the key so like from "AM-12" to "12")
    const [, rawId] = key.split("-");

    try {
      const res = await fetch(`${API_BASE}/api/supplements/${rawId}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const updated = normalizeSupplement(await res.json());
        // Sync streak, supply, and unit back from backend into local state
        setSupplements((prev) =>
          prev.map((s) =>
            String(s.id) === rawId
              ? {
                  ...s,
                  streak: updated.streak,
                  supplyCount: updated.supplyCount,
                  dailyDose: updated.dailyDose,
                }
              : s,
          ),
        );
      }
    } catch (err) {
      console.error("Toggle supplement sync failed:", err);
    }
  };

  const handleAddSupp = async (s: Omit<Supplement, "id">): Promise<boolean> => {
    setSuppError(null);
    try {
      const res = await fetch(`${API_BASE}/api/supplements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(s),
      });
      if (res.ok) {
        const created = normalizeSupplement(await res.json());
        setSupplements((prev) => [...prev, created]);
        return true; // Return true on success
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to add supplement:", err);
        setSuppError(
          err.error || "Failed to add supplement. Please try again.",
        );
        return false; // Return false on failure
      }
    } catch (err) {
      console.error("Network error adding supplement:", err);
      setSuppError(
        "Network error, please check your connection and try again.",
      );
      return false; // Return false on failure
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

  // Refill a supplement's supply count, called when the low-supply badge is clicked
  const handleRefill = async (id: string | number, newSupply: number) => {
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, supplyCount: newSupply } : s)),
    );
    try {
      await fetch(`${API_BASE}/api/supplements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ supplyCount: newSupply }),
      });
    } catch (err) {
      console.error("Refill sync failed:", err);
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
    setScanning(false); // reset scan state upon open
    setScanError(null);
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

  // new Barcode scanner that opens device camera, decodes barcode, looks up nutrition via OpenFoodFacts
  // will be only available in create new meal log since editing an existing log doesn't need a new scan
  const handleBarcodeScan = async () => {
    setScanError(null);
    setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      // decodeOnceFromVideoDevice uses the default camera (rear on mobile, front on desktop for mine(mac)). then the second arg is the vid element id rendered below the meal name input
      const result = await reader.decodeOnceFromVideoDevice(
        undefined,
        "barcode-video",
      );
      const barcode = result.getText();
      // OpenFoodFacts free API that returns product nutrition per 100g
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      );
      const data = await res.json();

      if (data.status === 1) {
        const n = data.product.nutriments;
        // serving_size in grams if available, otherwise fall back to 100g
        const servingG = parseFloat(data.product.serving_size) || 100;
        const factor = servingG / 100;

        setMealName(data.product.product_name || "");
        setMealCalories(
          Math.round((n["energy-kcal_100g"] || 0) * factor).toString(),
        );
        setMealProtein(
          Math.round((n["proteins_100g"] || 0) * factor).toString(),
        );
        setMealCarbs(
          Math.round((n["carbohydrates_100g"] || 0) * factor).toString(),
        );
        setMealFats(Math.round((n["fat_100g"] || 0) * factor).toString());
      } else {
        // let user fill manually
        setScanError("Product not found. Please enter nutrition manually.");
      }
    } catch (err) {
      console.error("Barcode scan failed:", err);
      setScanError("Scan failed or cancelled. Please enter manually.");
    } finally {
      setScanning(false);
    }
  };

  // Delete Daily Log
  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal log?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/nutrition/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        const nextMeals = meals.filter((m) => m.id !== id);
        setMeals(nextMeals);
        const todayStr = (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        })();
        setHistory((prev) => {
          const todayEntry = {
            date: todayStr,
            calories: nextMeals.reduce((s, m) => s + m.calories, 0),
            protein: nextMeals.reduce((s, m) => s + m.protein, 0),
            carbs: nextMeals.reduce((s, m) => s + m.carbs, 0),
            fats: nextMeals.reduce((s, m) => s + m.fats, 0),
            meal_count: nextMeals.length,
          };
          const without = prev.filter((d) => d.date !== todayStr);
          return [...without, todayEntry].sort((a, b) =>
            a.date.localeCompare(b.date),
          );
        });
      }
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
        let nextMeals = meals;

        if (modalMode === "create") {
          const newMeal = await res.json();
          nextMeals = [...meals, newMeal];
          setMeals(nextMeals);

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
          nextMeals = meals.map((m) => (m.id === editingId ? updatedMeal : m));
          setMeals(nextMeals);
        } else if (modalMode === "edit_saved") {
          fetchNutritionData();
        }

        // Keep the chart in sync without a round-trip:
        // Recalculate today's totals from the updated meals list and patch history.
        if (modalMode === "create" || modalMode === "edit_log") {
          const todayStr = (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          })();
          setHistory((prev) => {
            const todayEntry = {
              date: todayStr,
              calories: nextMeals.reduce((s, m) => s + m.calories, 0),
              protein: nextMeals.reduce((s, m) => s + m.protein, 0),
              carbs: nextMeals.reduce((s, m) => s + m.carbs, 0),
              fats: nextMeals.reduce((s, m) => s + m.fats, 0),
              meal_count: nextMeals.length,
            };
            const without = prev.filter((d) => d.date !== todayStr);
            return [...without, todayEntry].sort((a, b) =>
              a.date.localeCompare(b.date),
            );
          });
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
    <AppShell>
      <AppHeader
        rightActions={
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        }
      />

      <PageHeader
        eyebrow={today}
        title="Health & Nutrition"
        description="Track meals, supplements, quests and progress"
        actions={<DailyQuoteCard />}
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {dataLoading ? (
        <p className="text-center text-sm text-slate-400">
          Loading nutrition panel...
        </p>
      ) : (
        <>
          <LocalTabs
            items={[
              { id: "tracker", label: "Meals & Supplements" },
              { id: "insights", label: "Quests & Progress" },
            ]}
            activeId={activeSection}
            onChange={(id) => setActiveSection(id as "tracker" | "insights")}
          />

          {activeSection === "tracker" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <NutritionTracker
                  meals={meals}
                  onAddMealClick={openCreateModal}
                  onEditMealClick={openEditLogModal}
                  onDeleteMealClick={handleDeleteLog}
                  calorieTarget={targets.calories}
                  proteinTarget={targets.protein}
                  fitnessGoal={metricsForm.goal}
                />
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <SupplementTracker
                  supplements={supplements}
                  checkedIds={checkedSupps}
                  onToggle={handleToggleSupp}
                  onAdd={handleAddSupp}
                  onDelete={handleDeleteSupp}
                  onRefill={handleRefill}
                  addError={suppError}
                  onClearError={() => setSuppError(null)}
                />
              </section>
            </div>
          )}

          {activeSection === "insights" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <QuestPanel quests={quests} totalXP={totalXP} />
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
                <NutritionChart history={history} calorieTarget={targets.calories} proteinTarget={targets.protein} />
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
                  <p className="text-sm text-green-700">{insight}</p>
                </div>
              </section>
            </div>
          )}
        </>
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

            {/* Meal name scan button only shown in create mode */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Meal Name (e.g., Chicken Rice)"
                value={mealName}
                onChange={(e) => {
                  setMealName(e.target.value);
                  setScanError(null);
                }}
                style={{ ...inputStyle, flex: 1 }}
                required
              />
              {/* Barcode scan only relevant when logging a new meal */}
              {modalMode === "create" && (
                <button
                  type="button"
                  onClick={handleBarcodeScan}
                  disabled={scanning}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: scanning ? "#f1f5f9" : "white",
                    color: "#475569",
                    cursor: scanning ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <BsUpcScan size={16} />
                  {scanning ? "Scanning…" : "Scan"}
                </button>
              )}
            </div>

            {/* Camera preview only when scan active */}
            {scanning && (
              <video
                id="barcode-video"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#000",
                }}
                muted
                playsInline
              />
            )}

            {/* Scan error feedback,it clears when user starts typing manually */}
            {scanError && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <AlertCircle
                  size={14}
                  style={{ color: "#ef4444", flexShrink: 0 }}
                />
                <p style={{ margin: 0, fontSize: "12px", color: "#ef4444" }}>
                  {scanError}
                </p>
              </div>
            )}
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
    </AppShell>
  );
}
