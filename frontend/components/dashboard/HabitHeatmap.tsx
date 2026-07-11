"use client";

import { useState } from "react";

export type HeatmapStatus = "done" | "skipped" | "missed" | "future" | "none";

export type HeatmapDay = {
  date: string; // YYYY-MM-DD, SGT
  status: HeatmapStatus;
};

const CELL = 11;
const GAP = 3;

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

function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-SG", { month: "short" });
}

/**
 * GitHub-contribution-style heatmap. Expects `data` ascending by date (oldest first).
 * Doesn't need to start on a Monday — the component pads the first column itself.
 */
export default function HabitHeatmap({
  data,
  habitColor,
}: {
  data: HeatmapDay[];
  habitColor: string;
}) {
  const [hovered, setHovered] = useState<HeatmapDay | null>(null);

  if (data.length === 0) return null;

  const firstDayOfWeek = new Date(data[0].date).getDay(); // 0 = Sun
  const leadingPad = (firstDayOfWeek + 6) % 7; // Mon = 0
  const padded: (HeatmapDay | null)[] = [...Array(leadingPad).fill(null), ...data];
  const weekCount = Math.ceil(padded.length / 7);

  const columns: (HeatmapDay | null)[][] = [];
  for (let w = 0; w < weekCount; w++) {
    columns.push(padded.slice(w * 7, w * 7 + 7));
  }

  let lastMonth = "";
  const monthMarkers = columns.map((col) => {
    const firstReal = col.find((d) => d !== null);
    if (!firstReal) return "";
    const m = monthLabel(firstReal.date);
    if (m !== lastMonth) {
      lastMonth = m;
      return m;
    }
    return "";
  });

  const width = weekCount * (CELL + GAP);
  const height = 7 * (CELL + GAP) + 14;

  return (
    <div style={{ position: "relative", overflowX: "auto", padding: "4px 0" }}>
      <svg width={width} height={height} style={{ display: "block" }}>
        {monthMarkers.map((label, w) =>
          label ? (
            <text key={`m-${w}`} x={w * (CELL + GAP)} y={10} fontSize={9} fill="var(--color-text-secondary, #64748b)">
              {label}
            </text>
          ) : null,
        )}
        {columns.map((col, w) =>
          col.map((day, r) => {
            if (!day) return null;
            const x = w * (CELL + GAP);
            const y = 14 + r * (CELL + GAP);
            const isSkipped = day.status === "skipped";
            return (
              <rect
                key={day.date}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                fill={statusFill(day.status, habitColor)}
                stroke={
                  day.status === "missed"
                    ? "var(--color-border-secondary, #cbd5e1)"
                    : isSkipped
                      ? "#94a3b8"
                      : "none"
                }
                strokeWidth={isSkipped ? 1 : 0}
                strokeDasharray={isSkipped ? "2,1.5" : undefined}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              />
            );
          }),
        )}
      </svg>
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 4,
            background: "#1e293b",
            color: "#fff",
            fontSize: 11,
            padding: "3px 7px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {new Date(hovered.date).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}
          {" · "}
          {hovered.status === "done" ? "Completed" : hovered.status === "skipped" ? "Rest day" : hovered.status === "missed" ? "Missed" : ""}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 10, color: "var(--color-text-secondary, #64748b)" }}>
        <LegendSwatch color={habitColor} label="Done" />
        <LegendSwatch dashed label="Rest day" />
        <LegendSwatch color="var(--color-background-secondary, #f1f5f9)" bordered label="Missed" />
      </div>
    </div>
  );
}

function LegendSwatch({ color, dashed, bordered, label }: { color?: string; dashed?: boolean; bordered?: boolean; label: string }) {
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