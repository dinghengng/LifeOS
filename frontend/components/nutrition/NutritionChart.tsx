"use client";

import { useState } from "react";

export type DayData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_count: number;
};

interface NutritionChartProps {
  history: DayData[];
  calorieTarget: number;
  proteinTarget: number;
}

type Metric = "calories" | "protein";

const COLORS = {
  calories: { bar: "#4f46e5", target: "#a5b4fc", bg: "#eef2ff", text: "#4338ca" },
  protein:  { bar: "#1D9E75", target: "#6ee7b7", bg: "#f0fdf4", text: "#15803d" },
};

function fmt(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-SG", { weekday: "short" }).slice(0, 3);
}

function fmtWeek(history: DayData[]) {
  if (history.length === 0) return "";
  const first = new Date(history[0].date + "T00:00:00");
  const last  = new Date(history[history.length - 1].date + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${first.toLocaleDateString("en-SG", opts)} – ${last.toLocaleDateString("en-SG", opts)}`;
}

export default function NutritionChart({ history, calorieTarget, proteinTarget }: NutritionChartProps) {
  const [metric, setMetric] = useState<Metric>("calories");
  const [hovered, setHovered] = useState<number | null>(null);

  const target = metric === "calories" ? calorieTarget : proteinTarget;
  const unit   = metric === "calories" ? "kcal" : "g";
  const color  = COLORS[metric];

  const values     = history.map(d => d[metric]);
  const maxVal     = Math.max(...values, target * 1.1);
  const weekTotal  = values.reduce((a, b) => a + b, 0);
  const weekAvg    = history.length ? Math.round(weekTotal / history.length) : 0;
  const daysLogged = history.filter(d => d.meal_count > 0).length;
  const avgVsTarget = weekAvg - target;

  const suggestion = (() => {
    if (daysLogged < 3) return null;
    const diff = weekAvg - target;

    if (metric === "calories") {
      if (diff > 300)
        return { delta: -150, label: "consistently over by a significant margin, pulling target down 150 kcal" };
      if (diff > 200)
        return { delta: -100, label: "consistently over, nudging target down 100 kcal" };
      if (diff < -600)
        return { delta: +200, label: "significantly under, either under-logging or under-eating. Nudging target up 200 kcal" };
      if (diff < -300)
        return { delta: +100, label: "consistently under, nudging target up 100 kcal" };
      if (Math.abs(diff) <= 100 && daysLogged >= 5)
        return { delta: 0, label: "right on target this week! no adjustment needed. Great consistency" };
    }

    if (metric === "protein") {
      if (diff < -40)
        return { delta: +10, label: "well under your protein target, nudging up 10g" };
      if (diff < -20)
        return { delta: +5, label: "consistently under, nudging protein up 5g" };
      if (diff > 30)
        return { delta: -5, label: "exceeding protein target consistently, you could ease back 5g" };
      if (Math.abs(diff) <= 10 && daysLogged >= 5)
        return { delta: 0, label: "hitting your protein target consistently! no adjustment needed" };
    }
    return null;
  })();

  const barHeightPct  = (val: number) => `${Math.min((val / maxVal) * 100, 100)}%`;
  const targetLinePct = `${Math.min((target / maxVal) * 100, 100)}%`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Weekly Overview
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{fmtWeek(history)}</p>
        </div>

        <div style={{
          display: "flex",
          background: "#f1f5f9",
          borderRadius: 8,
          padding: 3,
          gap: 2,
        }}>
          {(["calories", "protein"] as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: metric === m ? "white" : "transparent",
                color: metric === m ? COLORS[m].text : "#94a3b8",
                boxShadow: metric === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {m === "calories" ? "Calories" : "Protein"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
        {[
          {
            label: "Daily avg",
            value: `${weekAvg} ${unit}`,
            highlight: false,
          },
          {
            label: "vs target",
            value: daysLogged >= 3
              ? `${avgVsTarget >= 0 ? "+" : ""}${avgVsTarget} ${unit}`
              : "—",
            highlight: daysLogged >= 3 && Math.abs(avgVsTarget) > (metric === "calories" ? 150 : 10),
          },
          {
            label: "Days logged",
            value: `${daysLogged} / 7`,
            highlight: false,
          },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            padding: "10px 12px",
          }}>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{stat.label}</p>
            <p style={{
              margin: "2px 0 0",
              fontSize: 15,
              fontWeight: 500,
              color: stat.highlight
                ? (avgVsTarget > 0 ? "#dc2626" : "#1D9E75")
                : "var(--color-text-primary)",
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ position: "relative", height: 160, marginBottom: 8 }}>

        {/* Target line */}
        <div style={{
          position: "absolute",
          bottom: targetLinePct,
          left: 0,
          right: 0,
          borderTop: `1.5px dashed ${color.target}`,
          zIndex: 1,
        }} />
        <span style={{
          position: "absolute",
          bottom: `calc(${targetLinePct} + 4px)`,
          right: 0,
          fontSize: 10,
          color: color.text,
          fontWeight: 600,
          background: "var(--color-background-primary)",
          padding: "0 2px",
        }}>
          target
        </span>

        {/* Bars */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          height: "100%",
          gap: 6,
          position: "relative",
          zIndex: 2,
        }}>
          {history.map((day, i) => {
            const val       = day[metric];
            const isToday   = i === history.length - 1;
            const isOver    = val > target;
            const isEmpty   = val === 0;
            const isHovered = hovered === i;

            return (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 4px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1e293b",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}>
                    {val} {unit}
                  </div>
                )}

                <div style={{
                  width: "100%",
                  height: isEmpty ? 3 : barHeightPct(val),
                  borderRadius: "4px 4px 0 0",
                  background: isEmpty
                    ? "#e2e8f0"
                    : isOver
                      ? "#f87171"
                      : isToday
                        ? color.bar
                        : color.bar + "99",
                  transition: "height 0.4s ease, background 0.2s",
                  outline: isHovered ? `2px solid ${color.bar}` : "none",
                  outlineOffset: 1,
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: "flex", gap: 6 }}>
        {history.map((day, i) => (
          <div key={day.date} style={{ flex: 1, textAlign: "center" }}>
            <span style={{
              fontSize: 11,
              color: i === history.length - 1 ? color.text : "#94a3b8",
              fontWeight: i === history.length - 1 ? 700 : 400,
            }}>
              {fmt(day.date)}
            </span>
          </div>
        ))}
      </div>

      {/* Adaptive suggestion */}
      {suggestion && (
        <div style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 8,
          background: color.bg,
          border: `0.5px solid ${color.target}`,
        }}>
          <span style={{ fontSize: 13, color: color.text }}>
            Your 7-day average is {suggestion.label}.
            {suggestion.delta !== 0 && (
              <> Next week's suggested target: <strong>{target + suggestion.delta} {unit}</strong>.</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}