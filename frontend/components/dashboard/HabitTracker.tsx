import HabitRow, { Habit } from "./HabitRow";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitTracker({
  habits,
  onToggleToday,
  onAddClick, 
}: {
  habits: Habit[];
  onToggleToday: (id: string) => void;
  onAddClick: () => void; 
}) {
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
          Habit tracker
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {DAYS.map((d, i) => (
            <span key={i} style={{ width: 18, textAlign: "center", fontSize: 10, color: i === 6 ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: i === 6 ? 500 : 400 }}>
              {d}
            </span>
          ))}
          <span style={{ width: 28, textAlign: "center", fontSize: 10, color: "var(--color-text-secondary)" }}>✓</span>
        </div>
      </div>

      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} onToggleToday={onToggleToday} />
      ))}

      <button
        onClick={onAddClick} 
        style={{
          marginTop: 14,
          width: "100%",
          padding: "8px 0",
          fontSize: 13,
          color: "var(--color-text-secondary)",
          background: "transparent",
          border: "0.5px dashed var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          cursor: "pointer",
        }}
      >
        + Add habit
      </button>
    </div>
  );
}