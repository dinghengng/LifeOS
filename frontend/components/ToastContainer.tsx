"use client";

import { useToast, ToastType } from "../app/hooks/useToast";

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "✓" },
  error:   { bg: "#fef2f2", border: "#fca5a5", icon: "✕" },
  info:    { bg: "#eff6ff", border: "#93c5fd", icon: "i" },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map((t) => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              backgroundColor: c.bg,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 13,
              fontWeight: 500,
              color: "#1e293b",
              pointerEvents: "all",
              minWidth: 220,
              maxWidth: 360,
              animation: "slideUp 0.2s ease",
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              backgroundColor: c.border,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {c.icon}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#94a3b8", fontSize: 14, padding: 0, lineHeight: 1,
              }}
              aria-label="Dismiss"
            >×</button>
          </div>
        );
      })}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}