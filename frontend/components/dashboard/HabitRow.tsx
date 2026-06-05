"use client";

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
  completedDays: boolean[]; // last 7 days, index 0 means oldest day
};

export default function HabitRow({
  habit,
  onToggleToday,
}: {
  habit: Habit;
  onToggleToday: (id: string) => void;
}) {
  const todayDone = habit.completedDays[6];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
        {habit.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {habit.name}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "var(--color-text-secondary)",
          }}
        >
          🔥 {habit.streak} day streak
        </p>
      </div>

      {/* Dynamic 7-day completion grid rolling backwards from today */}
      <div style={{ display: "flex", gap: 4 }}>
        {habit.completedDays.map((done, i) => {
          // for now index 6 means today and possbily can change this in future to sync
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - (6 - i));
          const dayLabel = targetDate.toLocaleDateString("en-SG", { weekday: "narrow" }); 

          return (
            <div
              key={i}
              title={dayLabel}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                backgroundColor: done ? habit.color : "var(--color-background-secondary)",
                border: done ? "none" : "0.5px solid var(--color-border-secondary)",
                opacity: i === 6 ? 1 : 0.8,
              }}
            />
          );
        })}
      </div>

      {/* Today toggle button */}
      <button
        onClick={() => onToggleToday(habit.id)}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: todayDone ? "none" : "1.5px solid var(--color-border-secondary)",
          backgroundColor: todayDone ? habit.color : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: todayDone ? "#fff" : "var(--color-text-secondary)",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
        aria-label={todayDone ? "Mark incomplete" : "Mark complete"}
      >
        {todayDone ? "✓" : ""}
      </button>
    </div>
  );
}