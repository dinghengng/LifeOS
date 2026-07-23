"use client";

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface LocalTabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function LocalTabs({
  items,
  activeId,
  onChange,
}: LocalTabsProps) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max items-center gap-8 border-b border-slate-200">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              id={`tour-${item.id}-tab`}
              onClick={() => onChange(item.id)}
              className={[
                "relative pb-2 text-sm font-medium transition-colors",
                isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-2">{item.label}</span>

              {isActive ? (
                <span className="absolute inset-x-0 bottom-0 h-px rounded-full bg-slate-900" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}