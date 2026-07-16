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
    <aside className="w-[180px] flex-shrink-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
      {stats.map((s) => (
        <div key={s.label}>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {s.label}
          </p>
          <p className="m-0 text-2xl font-medium" style={{ color: s.color }}>
            {s.value}
          </p>
        </div>
      ))}
    </aside>
  );
}