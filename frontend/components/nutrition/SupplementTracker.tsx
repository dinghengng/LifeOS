"use client";

import { useState } from "react";
import { Plus, X, Pill, Flame, AlertTriangle, PackageOpen } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";

export type Supplement = {
  id: string | number;
  name: string;
  dose: string;
  timing: "AM" | "PM" | "Both";
  streak?: number;        
  supplyCount?: number;   
  dailyDose?: number;     
  supplyUnit?: string;   
};

interface SupplementTrackerProps {
  supplements: Supplement[];
  checkedIds: Set<string>;
  onToggle: (key: string) => void;
  onAdd: (s: Omit<Supplement, "id">) => void | Promise<boolean>;
  onDelete: (id: string | number) => void;
  onRefill: (id: string | number, newSupply: number) => void;
  addError?: string | null;
  onClearError?: () => void;
}

const timingColor: Record<string, string> = {
  AM: "#f59e0b",
  PM: "#6366f1",
  Both: "#1D9E75",
};

// Static interaction lookup table. `noteKey` resolves via t(`supplementTracker.interactions.${noteKey}`)
const KNOWN_INTERACTIONS: { a: string; b: string; noteKey: string }[] = [
  { a: "iron",       b: "calcium",    noteKey: "ironCalcium" },
  { a: "iron",       b: "zinc",       noteKey: "ironZinc" },
  { a: "zinc",       b: "copper",     noteKey: "zincCopper" },
  { a: "zinc",       b: "calcium",    noteKey: "zincCalcium" },
  { a: "magnesium",  b: "calcium",    noteKey: "magnesiumCalcium" },
  { a: "calcium",    b: "zinc",       noteKey: "calciumZinc" },
  { a: "calcium",    b: "levothyrox", noteKey: "calciumLevothyroxine" },
  { a: "magnesium",  b: "levothyrox", noteKey: "magnesiumLevothyroxine" },
  { a: "iron",       b: "levothyrox", noteKey: "ironLevothyroxine" },
  { a: "vitamin c",  b: "vitamin b12",noteKey: "vitaminCB12" },
  { a: "vitamin a",  b: "vitamin d",  noteKey: "vitaminAD" },
  { a: "selenium",   b: "vitamin c",  noteKey: "seleniumVitaminC" },
  { a: "potassium",  b: "ace inhib",  noteKey: "potassiumAceInhibitor" },
  { a: "folic acid", b: "antacid",    noteKey: "folicAcidAntacid" },
  { a: "vitamin b12",b: "antacid",    noteKey: "vitaminB12Antacid" },
  { a: "fiber",      b: "multivitamin", noteKey: "fiberMultivitamin" },
  { a: "fish oil",   b: "vitamin e",  noteKey: "fishOilVitaminE" },
  { a: "melatonin",  b: "sedative",   noteKey: "melatoninSedative" },
];

// Returns a list of interaction note keys for the current supplement list.
// Caller resolves copy via t(`supplementTracker.interactions.${key}`).
function getInteractionWarningKeys(supplements: Supplement[]): string[] {
  const keys: string[] = [];
  const names = supplements.map((s) => s.name.toLowerCase());

  for (const pair of KNOWN_INTERACTIONS) {
    const hasA = names.some((n) => n.includes(pair.a));
    const hasB = names.some((n) => n.includes(pair.b));
    if (hasA && hasB) {
      keys.push(pair.noteKey);
    }
  }
  return keys;
}

// Returns days of supply left; returns null if supplyCount not set
function getDaysLeft(supp: Supplement): number | null {
  if (supp.supplyCount == null) return null;
  const perDay = supp.dailyDose ?? 1;
  return Math.floor(supp.supplyCount / perDay);
}

// Singularizes common unit words when count is 1 so like 1 pill, better for user experience
// Only handles the 4 units offered in the dropdown 
function formatUnit(count: number, unit: string): string {
  if (count === 1) {
    if (unit === "pills") return "pill";
    if (unit === "scoops") return "scoop";
    if (unit === "sachets") return "sachet";
    // "ml" has no singular/plural distinction
  }
  return unit;
}

const RoutineBlock = ({
  label,
  color,
  items,
  prefix,
  checkedIds,
  onToggle,
  onDelete,
  onRefill,
  t,
}: {
  label: string;
  color: string;
  items: Supplement[];
  prefix: "AM" | "PM";
  checkedIds: Set<string>;
  onToggle: (key: string) => void;
  onDelete: (id: string | number) => void;
  onRefill: (id: string | number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
          {t("supplementTracker.takenCount", { checked, total: items.length })}
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
          const daysLeft = getDaysLeft(supp);
          // Warn if 7 or fewer days of supply remain
          const lowSupply = daysLeft !== null && daysLeft <= 7;
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
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: done ? "#475569" : "var(--color-text-primary)",
                    textDecoration: done ? "line-through" : "none",
                    opacity: done ? 0.7 : 1,
                  }}>
                    {supp.name}
                  </span>
                  {supp.dose && (
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{supp.dose}</span>
                  )}
                  {/* Streak badge only shown when streak >= 2 to avoid noise */}
                  {supp.streak != null && supp.streak >= 2 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 2,
                      fontSize: 10, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 99,
                      background: "#fff7ed", color: "#ea580c",
                    }}>
                      <Flame size={9} />
                      {t("supplementTracker.streakDays", { days: supp.streak })}
                    </span>
                  )}
                  {/* Refill warning badge */}
                  {lowSupply && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRefill(supp.id); }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 2,
                        fontSize: 10, fontWeight: 700,
                        padding: "1px 6px", borderRadius: 99,
                        background: "#fef2f2", color: "#dc2626",
                        border: "none", cursor: "pointer",
                      }}
                      title={t("supplementTracker.refillTooltip")}
                    >
                      <PackageOpen size={9} />
                      {daysLeft === 0 ? t("supplementTracker.refillOutBtn") : t("supplementTracker.refillDaysLeftBtn", { days: daysLeft })}
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(supp.id); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#cbd5e1", padding: 2, display: "flex",
                  alignItems: "center", flexShrink: 0,
                }}
                title={t("supplementTracker.removeTooltip")}
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
  onRefill,
  addError,
  onClearError,
}: SupplementTrackerProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [timing, setTiming] = useState<"AM" | "PM" | "Both">("AM");
  // New form fields for refill tracking
  const [supplyCount, setSupplyCount] = useState("");
  const [dailyDose, setDailyDose] = useState("1");
  const [supplyUnit, setSupplyUnit] = useState("pills");

  const amSupps = supplements.filter((s) => s.timing === "AM" || s.timing === "Both");
  const pmSupps = supplements.filter((s) => s.timing === "PM" || s.timing === "Both");

  const checkedAM = amSupps.filter((s) => checkedIds.has(`AM-${s.id}`)).length;
  const checkedPM = pmSupps.filter((s) => checkedIds.has(`PM-${s.id}`)).length;

  // Compute interaction warning keys from the current supplement list
  const interactionWarningKeys = getInteractionWarningKeys(supplements);

  const handleAdd = async () => {
    if (!name.trim()) return;
    onClearError?.();
    const result = await onAdd({
      name: name.trim(),
      dose: dose.trim(),
      timing,
      // Only pass supply fields if the user filled them in, unit travels alongside so display stays correct
      ...(supplyCount ? { supplyCount: parseInt(supplyCount), dailyDose: parseInt(dailyDose) || 1, supplyUnit } : {}),
    });
    // Only reset and close the form on confirmed success
    // stays open with the user's input intact and addError renders inline.
    if (result !== false) {
      setName(""); setDose(""); setTiming("AM");
      setSupplyCount(""); setDailyDose("1"); setSupplyUnit("pills");
      setShowForm(false);
    }
  };
  const [refillingId, setRefillingId] = useState<string | number | null>(null);
  const [refillAmount, setRefillAmount] = useState("");
  const openRefillPopover = (id: string | number) => {
    setRefillingId(id);
    setRefillAmount("");
  };

  const confirmRefill = (id: string | number, currentSupply: number | undefined) => {
    const added = parseInt(refillAmount);
    if (isNaN(added) || added < 0) return;
    onRefill(id, (currentSupply ?? 0) + added);
    setRefillingId(null);
    setRefillAmount("");
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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {t("supplementTracker.title")}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            {t("supplementTracker.amPmSummary", {
              checkedAM,
              totalAM: amSupps.length,
              checkedPM,
              totalPM: pmSupps.length,
            })}
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
          {showForm ? t("supplementTracker.cancelBtn") : <><Plus size={14} /> {t("supplementTracker.addBtn")}</>}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: 10,
          padding: "14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <input placeholder={t("supplementTracker.namePlaceholder")} value={name}
            onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder={t("supplementTracker.dosePlaceholder")} value={dose}
              onChange={(e) => setDose(e.target.value)} style={inputStyle} />
            <select value={timing} onChange={(e) => setTiming(e.target.value as "AM" | "PM" | "Both")} style={inputStyle}>
              <option value="AM">{t("supplementTracker.timingMorning")}</option>
              <option value="PM">{t("supplementTracker.timingEvening")}</option>
              <option value="Both">{t("supplementTracker.timingBoth")}</option>
            </select>
          </div>
          {/* Unit applies to both supply count and per-day amount so the division always makes sense */}
          <div>
            <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>
              {t("supplementTracker.trackRefillLabel")}
            </label>
            <select value={supplyUnit} onChange={(e) => setSupplyUnit(e.target.value)} style={inputStyle}>
              <option value="pills">{t("supplementTracker.unitPills")}</option>
              <option value="ml">{t("supplementTracker.unitMl")}</option>
              <option value="scoops">{t("supplementTracker.unitScoops")}</option>
              <option value="sachets">{t("supplementTracker.unitSachets")}</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>
                {t("supplementTracker.totalSupplyLabel", { unit: supplyUnit })}
              </label>
              <input
                type="number"
                min="0"
                placeholder={t("supplementTracker.totalSupplyPlaceholder", { unit: supplyUnit })}
                value={supplyCount}
                onChange={(e) => setSupplyCount(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>
                {t("supplementTracker.usedPerDayLabel", { unit: supplyUnit })}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={dailyDose}
                onChange={(e) => setDailyDose(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          {/* Guardrail note so users don't confuse this with the free-text "dose" field above (e.g. "500mg") */}
          {supplyCount && (
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
              {t("supplementTracker.unitGuardrail", { unit: supplyUnit })}
            </p>
          )}
          <button onClick={handleAdd} disabled={!name.trim()} style={{
            padding: "8px", borderRadius: 6, border: "none",
            backgroundColor: name.trim() ? "#1D9E75" : "#e2e8f0",
            color: name.trim() ? "white" : "#94a3b8",
            fontWeight: 600, fontSize: 13,
            cursor: name.trim() ? "pointer" : "default", transition: "all 0.2s",
          }}>
            {t("supplementTracker.addToRoutineBtn")}
          </button>
          {addError && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 10px", borderRadius: 6,
              background: "#fef2f2", border: "1px solid #fecaca",
            }}>
              <AlertTriangle size={13} style={{ color: "#dc2626", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#b91c1c", flex: 1 }}>{addError}</p>
              <button
                type="button"
                onClick={() => onClearError?.()}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 2 }}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interaction warnings, is shown when 2+ supplements with a known interaction are present */}
      {interactionWarningKeys.length > 0 && (
        <div style={{
          marginBottom: 14,
          background: "#fffbeb",
          border: "0.5px solid #fcd34d",
          borderRadius: 8,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <AlertTriangle size={13} style={{ color: "#d97706", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("supplementTracker.interactionNoticeHeader")}
            </span>
          </div>
          {interactionWarningKeys.map((key) => (
            <p key={key} style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
              • {t(`supplementTracker.interactions.${key}`)}
            </p>
          ))}
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#a16207" }}>
            {t("supplementTracker.interactionDisclaimer")}
          </p>
        </div>
      )}

      {supplements.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "1.5rem 0",
          borderTop: "0.5px solid var(--color-border-tertiary)",
          color: "var(--color-text-secondary)", fontSize: 13,
        }}>
          {t("supplementTracker.emptyState")}
        </div>
      ) : (
        <>
          <div style={{
            maxHeight: 280,
            overflowY: "auto",
            paddingRight: 4,
            marginRight: -4,
            position: "relative",
          }}>
            <RoutineBlock label={t("supplementTracker.morningLabel")} color={timingColor.AM} items={amSupps} prefix="AM"
              checkedIds={checkedIds} onToggle={onToggle} onDelete={onDelete} onRefill={openRefillPopover} t={t} />
            <RoutineBlock label={t("supplementTracker.eveningLabel")} color={timingColor.PM} items={pmSupps} prefix="PM"
              checkedIds={checkedIds} onToggle={onToggle} onDelete={onDelete} onRefill={openRefillPopover} t={t} />

            {/* Inline refill card — replaces window.prompt with a styled, on-brand input */}
            {refillingId !== null && (() => {
              const target = supplements.find((s) => s.id === refillingId);
              if (!target) return null;
              return (
                <div style={{
                  position: "sticky", bottom: 0, left: 0, right: 0,
                  marginTop: 10, padding: "12px 14px", borderRadius: 10,
                  background: "white", border: "1px solid #fca5a5",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                    {t("supplementTracker.refillCardHeader", {
                      name: target.name,
                      count: target.supplyCount ?? 0,
                      unit: formatUnit(target.supplyCount ?? 0, target.supplyUnit ?? "units"),
                    })}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      placeholder={t("supplementTracker.unitsAddedPlaceholder", { unit: target.supplyUnit ?? "pills" })}
                      value={refillAmount}
                      onChange={(e) => setRefillAmount(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") confirmRefill(target.id, target.supplyCount); }}
                      style={{
                        flex: 1, boxSizing: "border-box", padding: "7px 10px",
                        borderRadius: 6, border: "1px solid #cbd5e1", color: "#1e293b", fontSize: 13,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => confirmRefill(target.id, target.supplyCount)}
                      disabled={!refillAmount}
                      style={{
                        padding: "7px 14px", borderRadius: 6, border: "none",
                        backgroundColor: refillAmount ? "#1D9E75" : "#e2e8f0",
                        color: refillAmount ? "white" : "#94a3b8",
                        fontWeight: 600, fontSize: 13,
                        cursor: refillAmount ? "pointer" : "default",
                      }}
                    >
                      {t("supplementTracker.confirmBtn")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRefillingId(null); setRefillAmount(""); }}
                      style={{
                        padding: "7px 12px", borderRadius: 6, border: "1px solid #cbd5e1",
                        backgroundColor: "white", color: "#64748b", fontSize: 13, cursor: "pointer",
                      }}
                    >
                      {t("supplementTracker.cancelBtn")}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {allDone && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "linear-gradient(135deg, #1D9E75 0%, #059669 100%)",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white" }}>
                {t("supplementTracker.allDoneMessage")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}