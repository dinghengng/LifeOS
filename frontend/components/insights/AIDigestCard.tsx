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
};

export type AIDigest = {
  narration: string | null;
  payload: AIDigestPayload;
  week_start: string;
  generated_at: string;
};

function TrendIcon({ trend }: { trend: "improving" | "declining" | "flat" }) {
  if (trend === "improving") return <span style={{ color: "#16a34a" }}>▲</span>;
  if (trend === "declining") return <span style={{ color: "#dc2626" }}>▼</span>;
  return <span style={{ color: "#94a3b8" }}>▬</span>;
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
  const cardStyle: React.CSSProperties = {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "1.5rem",
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          {t("insightsPage.aiDigestLoading")}
        </p>
      </div>
    );
  }

  if (!digest) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          {t("insightsPage.aiDigestEmpty")}
        </p>
      </div>
    );
  }

  const { payload } = digest;

  return (
    <div style={cardStyle}>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 12,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {t("insightsPage.aiDigestLabel", { weekStart: payload.week_start })}
      </p>

      <p
        style={{
          margin: "0 0 16px",
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--color-text-primary)",
        }}
      >
        {digest.narration}
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {payload.habits && (
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
              {t("insightsPage.aiDigestHabitsLabel")}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {Math.round(payload.habits.overall_completion_rate * 100)}%
            </p>
          </div>
        )}

        {payload.mood && (
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
              {t("insightsPage.aiDigestMoodLabel")}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {payload.mood.avg_mood}/5 <TrendIcon trend={payload.mood.trend} />
            </p>
          </div>
        )}

        {payload.goals && (
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
              {t("insightsPage.aiDigestGoalsLabel")}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {payload.goals.avg_progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}