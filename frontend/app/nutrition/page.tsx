"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import NutritionTracker, { Meal } from "../../components/nutrition/NutritionTracker";
import { User } from "../../../shared/types";
import { checkAuthStatus, logoutUser } from "../../../shared/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export default function NutritionPage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [meals, setMeals]             = useState<Meal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Modal configuration states
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealName, setMealName]       = useState("");
  const [mealType, setMealType]       = useState("Lunch");
  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein]   = useState("");
  const [mealCarbs, setMealCarbs]     = useState("");
  const [mealFats, setMealFats]       = useState("");

  // Auth check guard on mount
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

  // Isolated Nutrition Data Fetcher
  const fetchNutritionData = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/nutrition`, { credentials: "include" });
      if (!res.ok) throw new Error(`Nutrition fetch failed (${res.status})`);
      setMeals(await res.json());
    } catch (err) {
      console.error(err);
      setError("Failed to load today's meal logs.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchNutritionData();
  }, [authLoading, fetchNutritionData]);

  // Form Submission Handler
  async function handleCreateMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!mealName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/nutrition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mealName,
          mealType,
          calories: parseInt(mealCalories) || 0,
          protein: parseInt(mealProtein) || 0,
          carbs: parseInt(mealCarbs) || 0,
          fats: parseInt(mealFats) || 0
        })
      });
      if (res.ok) {
        const newMeal = await res.json();
        setMeals([...meals, newMeal]);
        setShowMealModal(false);
        // Reset states
        setMealName("");
        setMealCalories("");
        setMealProtein("");
        setMealCarbs("");
        setMealFats("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleLogout = async () => {
    try { await logoutUser(); } catch (err) { console.error(err); }
    router.push("/");
  };

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-background-tertiary,#f5f5f2)]">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary, #f5f5f2)", fontFamily: "var(--font-sans)", padding: "2rem" }}>
      
      {/* Navigation Header bar matching tasks and dashboard pages */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{today}</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>
            Health & Nutrition
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => router.push("/")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Tasks</button>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Dashboard</button>
          <button onClick={() => router.push("/journal")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Journal</button>
          <button onClick={() => router.push("/nutrition")} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid #4f46e5", backgroundColor: "#4f46e5", color: "#ffffff", cursor: "pointer" }}>Nutrition</button>
          <button onClick={handleLogout} style={{ padding: "6px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--color-border-secondary)", backgroundColor: "rgba(255, 255, 255, 0.7)", color: "#334155", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {dataLoading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>Loading nutrition panel...</p>
      ) : (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Render our custom tracker component centrally on this clean workspace page */}
          <NutritionTracker meals={meals} onAddMealClick={() => setShowMealModal(true)} />
        </div>
      )}

      {/*  nutrition log pop up */}
      {showMealModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowMealModal(false)}>
          <form onSubmit={handleCreateMeal} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "12px", width: "380px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: 0, color: "#1e293b" }}>Log New Meal</h3>
            
            <input type="text" placeholder="Meal Name (e.g., Chicken Rice)" value={mealName} onChange={e => setMealName(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#1e293b" }} required />
            
            <select value={mealType} onChange={e => setMealType(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#1e293b" }}>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input type="number" placeholder="Calories (kcal)" value={mealCalories} onChange={e => setMealCalories(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#1e293b" }} />
              <input type="number" placeholder="Protein (g)" value={mealProtein} onChange={e => setMealProtein(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#1e293b" }} />
              <input type="number" placeholder="Carbs (g)" value={mealCarbs} onChange={e => setMealCarbs(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#1e293b" }} />
              <input type="number" placeholder="Fats (g)" value={mealFats} onChange={e => setMealFats(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#1e293b" }} />
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowMealModal(false)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#1e293b", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#1D9E75", color: "white", cursor: "pointer" }}>Save</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}