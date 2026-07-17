"use client";

import { useState, useEffect } from "react";
import { useToastContext } from "../notifications/ToastContext";
import { useTranslation } from "../../context/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface MetricsForm {
  weight: string;
  height: string;
  goal: string;
}

function calculateTargets(weight: number, goal: string) {
  let calories = Math.round(weight * 24 * 1.2);
  const protein = Math.round(weight * 1.5);
  if (goal === "muscle_gain") calories += 300;
  if (goal === "fat_loss") calories -= 300;
  return { calories, protein };
}

// transparent border
const selectStyle =
  "w-full rounded-xl border-r-8 border-transparent bg-white pl-3 pr-4 py-2.5 text-sm text-slate-700 outline outline-1 outline-slate-300 focus:outline-2 focus:outline-indigo-400 transition";

const inputStyle =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

export default function NutritionGoalsSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState<MetricsForm>({ weight: "", height: "", goal: "muscle_gain" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<{ calories: number; protein: number } | null>(null);
  const { showToast } = useToastContext();

  useEffect(() => {
    fetch(`${API_BASE}/api/user/metrics`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          const filled = {
            weight: data.weight_kg?.toString() || "",
            height: data.height_cm?.toString() || "",
            goal: data.fitness_goal || "muscle_gain",
          };
          setForm(filled);
          if (data.weight_kg) {
            setPreview(calculateTargets(parseFloat(data.weight_kg), data.fitness_goal || "muscle_gain"));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const w = parseFloat(form.weight);
    if (w > 0) setPreview(calculateTargets(w, form.goal));
    else setPreview(null);
  }, [form.weight, form.goal]);

  const handleSave = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_BASE}/api/user/metrics`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_kg: parseFloat(form.weight) || null,
          height_cm: parseFloat(form.height) || null,
          fitness_goal: form.goal,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      showToast(t("nutritionGoals.toastUpdated"));
    } catch (err) {
      console.error("Failed to save metrics", err);
      showToast(t("nutritionGoals.toastSaveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-slate-400">{t("nutritionGoals.loading")}</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("nutritionGoals.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("nutritionGoals.description")}
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t("nutritionGoals.weightLabel")}</label>
            <p className="text-xs text-slate-500">
              {t("nutritionGoals.weightHint")}
            </p>
            <input
              type="number"
              min="20"
              max="400"
              step="0.1"
              placeholder={t("nutritionGoals.weightPlaceholder")}
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">
              {t("nutritionGoals.heightLabel")} <span className="font-normal text-slate-400">({t("nutritionGoals.optional")})</span>
            </label>
            <input
              type="number"
              min="50"
              max="270"
              step="1"
              placeholder={t("nutritionGoals.heightPlaceholder")}
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              className={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t("nutritionGoals.goalLabel")}</label>
            <select
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className={selectStyle}
            >
              <option value="maintain">{t("nutritionGoals.goalMaintain")}</option>
              <option value="muscle_gain">{t("nutritionGoals.goalMuscleGain")}</option>
              <option value="fat_loss">{t("nutritionGoals.goalFatLoss")}</option>
            </select>
          </div>

          {preview && (
            <div className="flex gap-8 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("nutritionGoals.dailyCalories")}
                </div>
                <div className="mt-0.5 text-xl font-bold text-green-600">
                  {preview.calories}{" "}
                  <span className="text-sm font-medium text-slate-500">{t("nutritionGoals.kcal")}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("nutritionGoals.proteinTarget")}
                </div>
                <div className="mt-0.5 text-xl font-bold text-green-600">
                  {preview.protein} <span className="text-sm font-medium text-slate-500">{t("nutritionGoals.grams")}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors ${
                saving ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {saving ? t("nutritionGoals.saving") : t("nutritionGoals.saveGoals")}
            </button>
            {saved && <span className="text-sm text-green-600">{t("nutritionGoals.saved")}</span>}
          </div>
        </form>
      </section>

      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{t("nutritionGoals.howCalculated.title")}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <li>{t("nutritionGoals.howCalculated.base")}</li>
            <li>{t("nutritionGoals.howCalculated.muscleGain")}</li>
            <li>{t("nutritionGoals.howCalculated.fatLoss")}</li>
            <li>{t("nutritionGoals.howCalculated.protein")}</li>
          </ul>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{t("nutritionGoals.tip.title")}</h2>
          <p className="mt-3 text-sm text-slate-600">
            {t("nutritionGoals.tip.description")}
          </p>
        </section>
      </div>
    </div>
  );
}