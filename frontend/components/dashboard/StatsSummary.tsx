export default function StatsSummary({
  completedToday,
  totalHabits,
  totalStreak,
  avgGoalProgress,
}: {
  completedToday: number;
  totalHabits: number;
  totalStreak: number;
  avgGoalProgress: number;
}) {
  const stats = [
    { label: "Habits done today", value: `${completedToday}/${totalHabits}`, color: "#1D9E75" },
    { label: "Total streak days", value: String(totalStreak), color: "#534AB7" },
    { label: "Avg. goal progress", value: `${avgGoalProgress}%`, color: "#D85A30" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.75rem" }}>
      {stats.map((s) => (
        <div key={s.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {s.label}
          </p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 500, color: s.color }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}