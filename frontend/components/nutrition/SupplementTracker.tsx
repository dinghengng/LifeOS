"use client";

import { useState } from "react";
import { Plus, X, Pill } from "lucide-react";

export type Supplement = {
  id: string | number;
  name: string;
  dose: string;
  timing: "AM" | "PM" | "Both";
};

interface SupplementTrackerProps {
  supplements: Supplement[];
  checkedIds: Set<string>;
  onToggle: (key: string) => void;
  onAdd: (s: Omit<Supplement, "id">) => void;
  onDelete: (id: string | number) => void;
}

const timingColor: Record<string, string> = {
  AM: "#f59e0b",
  PM: "#6366f1",
  Both: "#1D9E75",
};

const RoutineBlock = ({
  label,
  color,
  items,
  prefix,
  checkedIds,
  onToggle,
  onDelete,
}: {
  label: string;
  color: string;
  items: Supplement[];
  prefix: "AM" | "PM";
  checkedIds: Set<string>;
  onToggle: (key: string) => void;
  onDelete: (id: string | number) => void;
}) => {
  if (items.length === 0) return null;
  const checked = items.filter((s) => checkedIds.has(`${prefix}-${s.id}`)).length;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: color + "20", color,
        }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {checked}/{items.length} taken
        </span>
        <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${items.length ? (checked / items.length) * 100 : 0}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((supp) => {
          const key = `${prefix}-${supp.id}`;
          const done = checkedIds.has(key);
          return (
            <div
              key={key}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8,
                border: `0.5px solid ${done ? color + "50" : "var(--color-border-tertiary)"}`,
                background: done ? color + "0d" : "var(--color-background-secondary, #f8fafc)",
                cursor: "pointer", transition: "all 0.2s ease",
              }}
              onClick={() => onToggle(key)}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${done ? color : "#cbd5e1"}`,
                background: done ? color : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
              }}>
                {done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <Pill size={13} style={{ color: done ? color : "#94a3b8", flexShrink: 0 }} />

              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: done ? "#475569" : "var(--color-text-primary)",
                  textDecoration: done ? "line-through" : "none",
                  opacity: done ? 0.7 : 1,
                }}>
                  {supp.name}
                </span>
                {supp.dose && (
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>{supp.dose}</span>
                )}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(supp.id); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#cbd5e1", padding: 2, display: "flex",
                  alignItems: "center", flexShrink: 0,
                }}
                title="Remove"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SupplementTracker({
  supplements,
  checkedIds,
  onToggle,
  onAdd,
  onDelete,
}: SupplementTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [timing, setTiming] = useState<"AM" | "PM" | "Both">("AM");

  const amSupps = supplements.filter((s) => s.timing === "AM" || s.timing === "Both");
  const pmSupps = supplements.filter((s) => s.timing === "PM" || s.timing === "Both");

  const checkedAM = amSupps.filter((s) => checkedIds.has(`AM-${s.id}`)).length;
  const checkedPM = pmSupps.filter((s) => checkedIds.has(`PM-${s.id}`)).length;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), dose: dose.trim(), timing });
    setName(""); setDose(""); setTiming("AM"); setShowForm(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "7px 10px",
    borderRadius: 6, border: "1px solid #cbd5e1", color: "#1e293b", fontSize: 13,
  };

  const allDone =
    supplements.length > 0 &&
    amSupps.every((s) => checkedIds.has(`AM-${s.id}`)) &&
    pmSupps.every((s) => checkedIds.has(`PM-${s.id}`));

  return (
    <div style={{
      background: "var(--color-background-primary, #ffffff)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      marginTop: "1.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Supplements & Medication
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            AM: {checkedAM}/{amSupps.length} · PM: {checkedPM}/{pmSupps.length}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "6px 12px",
            backgroundColor: showForm ? "#f1f5f9" : "#1D9E75",
            color: showForm ? "#334155" : "white",
            border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {showForm ? "Cancel" : <><Plus size={14} /> Add</>}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: 10,
          padding: "14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <input placeholder="Name (e.g. Vitamin C, Creatine)" value={name}
            onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder="Dose (e.g. 500 mg)" value={dose}
              onChange={(e) => setDose(e.target.value)} style={inputStyle} />
            <select value={timing} onChange={(e) => setTiming(e.target.value as "AM" | "PM" | "Both")} style={inputStyle}>
              <option value="AM">Morning (AM)</option>
              <option value="PM">Evening (PM)</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <button onClick={handleAdd} disabled={!name.trim()} style={{
            padding: "8px", borderRadius: 6, border: "none",
            backgroundColor: name.trim() ? "#1D9E75" : "#e2e8f0",
            color: name.trim() ? "white" : "#94a3b8",
            fontWeight: 600, fontSize: 13,
            cursor: name.trim() ? "pointer" : "default", transition: "all 0.2s",
          }}>
            Add to routine
          </button>
        </div>
      )}

      {supplements.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "1.5rem 0",
          borderTop: "0.5px solid var(--color-border-tertiary)",
          color: "var(--color-text-secondary)", fontSize: 13,
        }}>
          No supplements added yet. Add your daily vitamins, medications, or supplements.
        </div>
      ) : (
        <>
          <div style={{
            maxHeight: 280,
            overflowY: "auto",
            paddingRight: 4,
            marginRight: -4,
          }}>
            <RoutineBlock label="Morning" color={timingColor.AM} items={amSupps} prefix="AM"
              checkedIds={checkedIds} onToggle={onToggle} onDelete={onDelete} />
            <RoutineBlock label="Evening" color={timingColor.PM} items={pmSupps} prefix="PM"
              checkedIds={checkedIds} onToggle={onToggle} onDelete={onDelete} />
          </div>

          {allDone && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "linear-gradient(135deg, #1D9E75 0%, #059669 100%)",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white" }}>
                💊 All supplements taken for today!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}