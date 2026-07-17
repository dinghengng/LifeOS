"use client";

import { useTranslation } from "../../context/LanguageContext";

export function MoodScienceCard() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">{t("moodScience.title")}</h2>
      <div className="flex flex-col gap-3 text-sm text-slate-600">
        <p>{t("moodScience.p1")}</p>
        <p>{t("moodScience.p2")}</p>
        <p>{t("moodScience.p3")}</p>
      </div>
    </div>
  );
}

export function MoodLinkTip() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">{t("moodTip.title")}</h2>
        <p className="mt-3 text-sm text-slate-600">
          {t("moodTip.content")}
        </p>
    </div>
  );
}