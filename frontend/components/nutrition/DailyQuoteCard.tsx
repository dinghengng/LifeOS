"use client";

import { Lightbulb } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";
import { TranslationKey } from "../../context/translations";

const NUTRITION_QUOTES_COUNT = 50; //Quotes that randomly generate

function getDailyQuoteIndex() {
  const date = new Date();
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % NUTRITION_QUOTES_COUNT;
}

export default function DailyQuoteCard() {
  const { t } = useTranslation();
  const quoteIndex = getDailyQuoteIndex();

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto 1.5rem", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem", textAlign: "center" }}>
            {t("dailyQuoteCard.title")}
        </span>
        <div style={{ position: "relative", padding: "0 1.5rem", textAlign: "center" }}>
            <span style={{ position: "absolute", top: -25, left: -15, fontSize: 64, color: "#e2e8f0", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            &ldquo;
            </span>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, letterSpacing: "-0.5px", position: "relative", zIndex: 1 }}>
            {t(`dailyQuoteCard.quotes.${quoteIndex}` as TranslationKey)}
            </p>
            <span style={{ position: "absolute", bottom: -45, right: -15, fontSize: 64, color: "#e2e8f0", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            &rdquo;
            </span>
        </div>
    </div>
  );
}