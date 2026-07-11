import GlobalNav from "./GlobalNav";

interface AppHeaderProps {
  rightActions?: React.ReactNode;
}

export default function AppHeader({ rightActions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 mb-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
            L
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">LifeOS</p>
            <p className="text-xs text-slate-500">Productivity and lifestyle hub</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <GlobalNav />
        </div>

        <div className="flex items-center gap-2">
          {rightActions ?? (
            <>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Notifications
              </button>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Help
              </button>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Account
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}