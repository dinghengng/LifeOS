import HabitRow, { Habit, getTodayIndexSGT, HABIT_GRID_COLUMNS, HABIT_GRID_GAP } from "./HabitRow";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitTracker({
  habits,
  onToggleToday,
  onAddClick,
  onEditHabit,
  onDeleteHabit,
}: {
  habits: Habit[];
  onToggleToday: (id: string) => void;
  onAddClick: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
}) {
  const todayIndex = getTodayIndexSGT();
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: HABIT_GRID_COLUMNS,
          gap: HABIT_GRID_GAP,
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            gridColumn: "1 / 3",
          }}
        >
          Habit tracker
        </h2>
        {DAYS.map((d, i) => (
          <span
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: i === todayIndex ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: i === todayIndex ? 500 : 400,
            }}
          >
            {d}
          </span>
        ))}
        <span style={{ textAlign: "center", fontSize: 10, color: "var(--color-text-secondary)" }}>✓</span>
        <div />
      </div>

      {habits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          onToggleToday={onToggleToday}
          onEdit={onEditHabit}
          onDelete={onDeleteHabit}
        />
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