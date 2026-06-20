"use client";

import { useState, useEffect } from "react";

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

export default function NutritionGoalsSection() {
  const [form, setForm] = useState<MetricsForm>({ weight: "", height: "", goal: "muscle_gain" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<{ calories: number; protein: number } | null>(null);

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
    } catch (err) {
      console.error("Failed to save metrics", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</div>;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    color: "#1e293b",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>

      <div style={rowStyle}>
        <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
          Weight (kg)
        </label>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
          Used to calculate your calorie and protein targets
        </p>
        <input
          type="number"
          min="20"
          max="400"
          step="0.1"
          placeholder="e.g. 75"
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={rowStyle}>
        <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
          Height (cm) <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
        </label>
        <input
          type="number"
          min="50"
          max="270"
          step="1"
          placeholder="e.g. 175"
          value={form.height}
          onChange={(e) => setForm({ ...form, height: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={rowStyle}>
        <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Primary Goal</label>
        <select
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          style={inputStyle}
        >
          <option value="maintain">Maintain Current Weight</option>
          <option value="muscle_gain">Build Muscle (Caloric Surplus)</option>
          <option value="fat_loss">Lose Fat (Caloric Deficit)</option>
        </select>
      </div>

      {preview && (
        <div style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          padding: "14px 16px",
          display: "flex",
          gap: 32,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Daily Calories
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a", marginTop: 2 }}>
              {preview.calories} <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>kcal</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Protein Target
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a", marginTop: 2 }}>
              {preview.protein} <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>g</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#4f46e5",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save Goals"}
        </button>
        {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </form>
  );
}