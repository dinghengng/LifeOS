"use client";

import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { label: "Tasks", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Journal", href: "/journal" },
  { label: "Nutrition", href: "/nutrition" },
  { label: "Settings", href: "/settings" },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();

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
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}