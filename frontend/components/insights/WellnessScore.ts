import type { Habit } from "../dashboard/HabitRow";
import type { Goal } from "../dashboard/GoalCard";
import type { DayData } from "../nutrition/NutritionChart";
import type { Supplement } from "../nutrition/SupplementTracker";

export type WellnessBreakdown = {
  habits: number;
  goals: number;
  nutrition: number;
  supplements: number;
  overall: number;
};

//rest days not counted against habit score, but skipped days are.
function scoreHabits(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  const perHabit = habits.map((h) => {
    const skips = h.skippedDays ?? Array(7).fill(false);
    const applicableDays = 7 - skips.filter(Boolean).length;
    if (applicableDays <= 0) return 100;
    const done = h.completedDays.filter(Boolean).length;
    return Math.min(100, (done / applicableDays) * 100);
  });
  return Math.round(perHabit.reduce((a, b) => a + b, 0) / perHabit.length);
}

// Goals calculate based on plain average of each goal's own progress percentage
function scoreGoals(goals: Goal[]): number {
  if (goals.length === 0) return 0;
  return Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length);
}

// average of per day score
function scoreNutrition(history: DayData[], calorieTarget?: number, proteinTarget?: number): number {
  const logged = history.filter((d) => d.meal_count > 0);
  if (logged.length === 0 || !calorieTarget || !proteinTarget) return 0;
  const perDay = logged.map((d) => {
    const caloriePct = Math.max(0, 100 - (Math.abs(d.calories - calorieTarget) / calorieTarget) * 100);
    const proteinPct = Math.min(100, (d.protein / proteinTarget) * 100);
    return (caloriePct + proteinPct) / 2;
  });
  return Math.round(perDay.reduce((a, b) => a + b, 0) / perDay.length);
}

// supplements are based on percentage of scheduled checked off
function scoreSupplements(supplements: Supplement[], checkedIds: Set<string>): number {
  if (supplements.length === 0) return 0;
  const amSupps = supplements.filter((s) => s.timing === "AM" || s.timing === "Both");
  const pmSupps = supplements.filter((s) => s.timing === "PM" || s.timing === "Both");
  const totalSlots = amSupps.length + pmSupps.length;
  if (totalSlots === 0) return 0;
  const checked = [
    ...amSupps.map((s) => `AM-${s.id}`),
    ...pmSupps.map((s) => `PM-${s.id}`),
  ].filter((key) => checkedIds.has(key)).length;
  return Math.round((checked / totalSlots) * 100);
}


export function computeWellnessScore({
  habits,
  goals,
  nutritionHistory = [],
  calorieTarget,
  proteinTarget,
  supplements = [],
  checkedIds = new Set<string>(),
}: {
  habits: Habit[];
  goals: Goal[];
  nutritionHistory?: DayData[];
  calorieTarget?: number;
  proteinTarget?: number;
  supplements?: Supplement[];
  checkedIds?: Set<string>;
}): WellnessBreakdown {
  const habitsScore = scoreHabits(habits);
  const goalsScore = scoreGoals(goals);
  const nutritionScore = scoreNutrition(nutritionHistory, calorieTarget, proteinTarget);
  const supplementsScore = scoreSupplements(supplements, checkedIds);

  const parts = [
    { score: habitsScore, has: habits.length > 0 },
    { score: goalsScore, has: goals.length > 0 },
    { score: nutritionScore, has: nutritionHistory.some((d) => d.meal_count > 0) },
    { score: supplementsScore, has: supplements.length > 0 },
  ].filter((p) => p.has);

  const overall = parts.length ? Math.round(parts.reduce((sum, p) => sum + p.score, 0) / parts.length) : 0;

  return {
    habits: habitsScore,
    goals: goalsScore,
    nutrition: nutritionScore,
    supplements: supplementsScore,
    overall,
  };
}