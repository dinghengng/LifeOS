import { useTranslation } from "../../context/LanguageContext";

export default function StatsSummary({
  completedToday,
  totalHabits,
  totalStreak,
  avgGoalProgress,
  loading = false,
}: {
  completedToday: number;
  totalHabits: number;
  totalStreak: number;
  avgGoalProgress: number;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const stats = [
    { label: t("statsSummary.habitsToday"), value: `${completedToday}/${totalHabits}`, color: "#1D9E75" },
    { label: t("statsSummary.totalStreak"), value: String(totalStreak), color: "#534AB7" },
    { label: t("statsSummary.avgGoalProgress"), value: `${avgGoalProgress}%`, color: "#D85A30" },
  ];


  return (
    <aside id="tour-dashboard-overview" className="w-45 flex-shrink-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
      {loading
        ? stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5">
              <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
              <div className="h-6 w-14 rounded bg-slate-100 animate-pulse" />
            </div>
          ))
        : stats.map((s) => (
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