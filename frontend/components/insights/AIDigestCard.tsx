import { Sparkles, TrendingUp, TrendingDown, Minus, Flame, Target } from "lucide-react";
import type { TranslationKey } from "../../context/translations";

type TFunc = (key: TranslationKey, params?: Record<string, string | number>) => string;

export type AIDigestPayload = {
  week_start: string;
  week_end: string;
  habits?: {
    overall_completion_rate: number;
    best_day: string | null;
    top_habit?: { name: string; streak: number } | null;
  } | null;
  mood?: {
    avg_mood: number;
    trend: "improving" | "declining" | "flat";
  } | null;
  goals?: {
    active_count: number;
    avg_progress: number;
  } | null;
  journal?: {
    top_themes: { theme: string; count: number }[];
  } | null;
};

export type AIDigest = {
  narration: string | null;
  payload: AIDigestPayload;
  week_start: string;
  generated_at: string;
};

//Purple accent colors for the card
const ACCENT = "#6366F1";
const ACCENT_DARK = "#4F46E5";
const ACCENT_TINT = "#EEF2FF";
const ACCENT_BORDER = "#E0E7FF";

function formatWeekRange(weekStart: string, weekEnd: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = new Date(weekStart + "T00:00:00Z").toLocaleDateString(undefined, opts);
  const end = new Date(weekEnd + "T00:00:00Z").toLocaleDateString(undefined, opts);
  return `${start} – ${end}`;
}

function StatChip({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: "improving" | "declining" | "flat";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        background: "#ffffff",
        border: `1px solid ${ACCENT_BORDER}`,
      }}
    >
      <span style={{ display: "flex", color: ACCENT_DARK }}>{icon}</span>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 4 }}>
          {value}
          {trend === "improving" && <TrendingUp size={13} style={{ color: "#16a34a" }} />}
          {trend === "declining" && <TrendingDown size={13} style={{ color: "#dc2626" }} />}
          {trend === "flat" && <Minus size={13} style={{ color: "#94a3b8" }} />}
        </span>
      </div>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--border-radius-lg, 20px)",
        padding: "1.5rem",
        background: `linear-gradient(135deg, ${ACCENT_TINT} 0%, var(--color-background-primary, #ffffff) 55%)`,
        border: `1px solid ${ACCENT_BORDER}`,
        overflow: "hidden",
      }}
    >
      {/* Faint decorative glow — the one "signature" flourish, kept quiet */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

function Eyebrow({ t, children }: { t: TFunc; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 7,
            background: ACCENT,
          }}
        >
          <Sparkles size={13} color="#ffffff" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT_DARK, letterSpacing: "0.02em" }}>
          {t("insightsPage.aiDigestTitle")}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function AIDigestCard({
  digest,
  loading,
  t,
}: {
  digest: AIDigest | null;
  loading: boolean;
  t: TFunc;
}) {
  if (loading) {
    return (
      <CardShell>
        <Eyebrow t={t}>
          <div style={{ width: 70, height: 16, borderRadius: 6, background: ACCENT_BORDER }} />
        </Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 12, borderRadius: 6, background: "#f1f5f9", width: "95%" }} />
          <div style={{ height: 12, borderRadius: 6, background: "#f1f5f9", width: "88%" }} />
          <div style={{ height: 12, borderRadius: 6, background: "#f1f5f9", width: "60%" }} />
        </div>
      </CardShell>
    );
  }

  if (!digest) {
    return (
      <div
        style={{
          borderRadius: "var(--border-radius-lg, 20px)",
          padding: "2rem 1.5rem",
          border: `1.5px dashed ${ACCENT_BORDER}`,
          textAlign: "center",
        }}
      >
        <Sparkles size={20} style={{ color: ACCENT, opacity: 0.5, marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          {t("insightsPage.aiDigestEmpty")}
        </p>
      </div>
    );
  }

  const { payload } = digest;

  return (
    <CardShell>
      <Eyebrow t={t}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: ACCENT_DARK,
            background: "#ffffff",
            border: `1px solid ${ACCENT_BORDER}`,
            padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          {formatWeekRange(payload.week_start, payload.week_end)}
        </span>
      </Eyebrow>

      <p
        style={{
          margin: "0 0 18px",
          fontSize: 15.5,
          lineHeight: 1.65,
          color: "#1e1b4b",
          fontWeight: 450,
        }}
      >
        {digest.narration}
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {payload.habits && (
          <StatChip
            icon={<Flame size={15} />}
            label={t("insightsPage.aiDigestHabitsLabel")}
            value={`${Math.round(payload.habits.overall_completion_rate * 100)}%`}
          />
        )}
        {payload.mood && (
          <StatChip
            icon={<Sparkles size={15} />}
            label={t("insightsPage.aiDigestMoodLabel")}
            value={`${payload.mood.avg_mood}/5`}
            trend={payload.mood.trend}
          />
        )}
        {payload.goals && (
          <StatChip
            icon={<Target size={15} />}
            label={t("insightsPage.aiDigestGoalsLabel")}
            value={`${payload.goals.avg_progress}%`}
          />
        )}
      </div>

      {payload.journal && payload.journal.top_themes.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t("insightsPage.aiDigestThemesLabel")}
          </span>
          {payload.journal.top_themes.map(({ theme, count }) => (
            <span
              key={theme}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: ACCENT_DARK,
                background: "#ffffff",
                border: `1px solid ${ACCENT_BORDER}`,
                padding: "3px 10px",
                borderRadius: 999,
              }}
            >
              {theme} · {count}
            </span>
          ))}
        </div>
      )}
    </CardShell>
  );
}