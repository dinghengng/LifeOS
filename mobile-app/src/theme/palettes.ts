import { Priority } from "@shared/types";

export const priorityColors: Record<Priority, string> = {
  critical: "#ef4444",
  high: "#f97316",
  low: "#3b82f6",
  none: "#94a3b8",
};

export const lightTheme = {
  bg: "#f8fafc",
  surface: "#ffffff",
  surfaceAlt: "#f1f5f9",
  text: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  accent: "#4f46e5",
  danger: "#ef4444",
  success: "#22c55e",
  shadow: "#000",
  statusBar: "dark-content" as const,
  progressTrack: "#e2e8f0",
};

export const darkTheme = {
  bg: "#0f172a",
  surface: "#1e293b",
  surfaceAlt: "#334155",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  border: "#334155",
  accent: "#818cf8",
  danger: "#f87171",
  success: "#4ade80",
  shadow: "#000",
  statusBar: "light-content" as const,
  progressTrack: "#334155",
};