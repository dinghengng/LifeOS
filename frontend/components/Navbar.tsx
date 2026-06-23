"use client";

import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "./notifications/NotificationBell";
import { Settings } from "lucide-react";

interface AppNavbarProps {
  onLogout: () => void;
}

const NAV_LINKS = [
  { label: "Tasks", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Journal", path: "/journal" },
  { label: "Nutrition", path: "/nutrition" },
];

export default function AppNavbar({ onLogout }: AppNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      {NAV_LINKS.map(({ label, path }) => {
        const isActive = pathname === path;
        return (
          <button
            key={path}
            onClick={() => router.push(path)}
            style={{
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: isActive ? "1px solid #4f46e5" : "1px solid var(--color-border-secondary)",
              backgroundColor: isActive ? "#4f46e5" : "rgba(255, 255, 255, 0.7)",
              color: isActive ? "#ffffff" : "#334155",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        );
      })}

      <NotificationBell />

      <button
        onClick={() => router.push("/settings")}
        style={{
          width: 34,
          height: 34,
          borderRadius: "8px",
          border: "1px solid var(--color-border-secondary)",
          backgroundColor: pathname === "/settings" ? "#4f46e5" : "rgba(255,255,255,0.7)",
          color: pathname === "/settings" ? "#ffffff" : "#64748b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        title="Settings"
      >
        <Settings size={16} />
      </button>

      <button
        onClick={onLogout}
        style={{
          padding: "6px 16px",
          fontSize: "14px",
          fontWeight: 600,
          borderRadius: "8px",
          border: "1px solid #fca5a5",
          backgroundColor: "rgba(255,255,255,0.7)",
          color: "#dc2626",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        Logout
      </button>
    </nav>
  );
}