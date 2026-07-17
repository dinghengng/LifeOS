"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "../../context/LanguageContext";

const NAV_ITEMS: {
  key: "tasks" | "dashboard" | "journal" | "nutrition" | "insights" | "challenges";
  href: string;
}[] = [
  { key: "tasks", href: "/" },
  { key: "dashboard", href: "/dashboard" },
  { key: "journal", href: "/journal" },
  { key: "nutrition", href: "/nutrition" },
  { key: "insights", href: "/insights" },
  { key: "challenges", href: "/challenges" },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/80 p-1 backdrop-blur-sm">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-200 text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
          >
            {t(`globalNav.${item.key}`)}
          </button>
        );
      })}
    </nav>
  );
}