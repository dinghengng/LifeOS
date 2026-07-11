"use client";

import { useState } from "react";

export type HeatmapStatus = "done" | "skipped" | "missed" | "future" | "none";

export type HeatmapDay = {
  date: string; // YYYY-MM-DD, SGT
  status: HeatmapStatus;
};

const CELL = 16;
const GAP = 4;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function statusFill(status: HeatmapStatus, habitColor: string): string {
  switch (status) {
    case "done":
      return habitColor;
    case "missed":
      return "var(--color-background-secondary, #f1f5f9)";
    case "skipped":
    case "future":
    case "none":
    default:
      return "transparent";
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function monthTitle(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-SG", { month: "long", year: "numeric" });
}

type MonthBlock = {
  key: string;
  title: string;
  weeks: (HeatmapDay | null)[][];
};

/** Groups into full calendar-month blocks, each a Mon-Sun grid. Days outside the habit's data 
 * (before it existed, or beyond today) render as blank cells rather than "missed".*/
function buildMonths(data: HeatmapDay[]): MonthBlock[] {
  if (data.length === 0) return [];

  const byDate = new Map(data.map((d) => [d.date, d]));
  const [firstY, firstM] = monthKey(data[0].date).split("-").map(Number);
  const [lastY, lastM] = monthKey(data[data.length - 1].date).split("-").map(Number);

  const months: MonthBlock[] = [];
  let y = firstY;
  let m = firstM;

  while (y < lastY || (y === lastY && m <= lastM)) {
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon = 0

    const cells: (HeatmapDay | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => {
        const dateStr = `${y}-${pad2(m)}-${pad2(i + 1)}`;
        return byDate.get(dateStr) ?? null;
      }),
    ];

    const weeks: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const key = `${y}-${pad2(m)}`;
    months.push({ key, title: monthTitle(key), weeks });

    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return months;
}

export default function HabitHeatmap({
  data,
  habitColor,
  maxMonths = 2,
}: {
  data: HeatmapDay[];
  habitColor: string;
  maxMonths?: number;
}) {
  const [hovered, setHovered] = useState<HeatmapDay | null>(null);

  if (data.length === 0) return null;

  const allMonths = buildMonths(data);
  const months = maxMonths > 0 ? allMonths.slice(-maxMonths) : allMonths;

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 4 }}>
        {months.map((month) => (
          <div key={month.key} style={{ flex: "0 0 auto" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-text-secondary, #64748b)",
                marginBottom: 4,
              }}
            >
              {month.title}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(7, ${CELL}px)`,
                gap: GAP,
                marginBottom: 3,
              }}
            >
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 8,
                    textAlign: "center",
                    color: "var(--color-text-secondary, #94a3b8)",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            {month.weeks.map((week, wi) => (
              <div
                key={wi}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(7, ${CELL}px)`,
                  gap: GAP,
                  marginBottom: GAP,
                }}
              >
                {week.map((day, di) => {
                  if (!day) return <div key={di} style={{ width: CELL, height: CELL }} />;
                  const isSkipped = day.status === "skipped";
                  return (
                    <div
                      key={di}
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        position: "relative",
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        background: statusFill(day.status, habitColor),
                        border:
                          day.status === "missed"
                            ? "1px solid var(--color-border-secondary, #cbd5e1)"
                            : isSkipped
                              ? "1px dashed #94a3b8"
                              : "none",
                        cursor: "default",
                      }}
                    >
                      {hovered === day && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "130%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#1e293b",
                            color: "#fff",
                            fontSize: 11,
                            padding: "3px 7px",
                            borderRadius: 4,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            zIndex: 10,
                          }}
                        >
                          {new Date(day.date).toLocaleDateString("en-SG", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                          {" · "}
                          {day.status === "done"
                            ? "Completed"
                            : day.status === "skipped"
                              ? "Rest day"
                              : day.status === "missed"
                                ? "Missed"
                                : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 8,
          fontSize: 10,
          color: "var(--color-text-secondary, #64748b)",
        }}
      >
        <LegendSwatch color={habitColor} label="Done" />
        <LegendSwatch dashed label="Rest day" />
        <LegendSwatch color="var(--color-background-secondary, #f1f5f9)" bordered label="Missed" />
      </div>
    </div>
  );
}

function LegendSwatch({
  color,
  dashed,
  bordered,
  label,
}: {
  color?: string;
  dashed?: boolean;
  bordered?: boolean;
  label: string;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: 2,
          background: dashed ? "transparent" : color,
          border: dashed ? "1px dashed #94a3b8" : bordered ? "1px solid #cbd5e1" : "none",
        }}
      />
      {label}
    </span>
  );
}