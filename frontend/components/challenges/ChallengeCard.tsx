import { ChallengeProgress } from "../../../shared/types";
import { createPost } from "../../../shared/api";
import { useToastContext } from "../notifications/ToastContext";
import ChallengeTier from "./ChallengeTier";
import { useTranslation } from "../../context/LanguageContext";

interface ChallengeCardProps {
  challenge: ChallengeProgress;
}

function formatTimeRemaining(periodEnd: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const end = new Date(periodEnd).getTime();
  const now = Date.now();
  const diffMs = end - now;
  if (diffMs <= 0) return t("challengeCard.resettingSoon");

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return t("challengeCard.daysHoursLeft", { days, hours });
  return t("challengeCard.hoursLeft", { hours });
}

// Challenge titles/descriptions are fixed, known ids defined server-side (config/challenges.js).
// Falls back to the API-provided text if a challenge id has no translation yet.
function localizeChallengeField(
  t: (key: string, params?: Record<string, string | number>) => string,
  challengeId: string,
  field: "title" | "description",
  fallback: string,
): string {
  const key = `challenge.${challengeId}.${field}`;
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { t } = useTranslation();
  const { showToast } = useToastContext();
  const periodLabel = challenge.period === "weekly" ? t("social.weekly") : t("social.monthly");

  const handleShare = async () => {
    if (!challenge.tier) return;
    try {
      await createPost(challenge.id, challenge.tier, challenge.periodStart, challenge.periodEnd);
      showToast(t("challengeCard.sharedToast", { tier: t(`tier.${challenge.tier}`), title: localizeChallengeField(t, challenge.id, "title", challenge.title) }), "success");
    } catch (err) {
      console.warn(err);
      const message = err instanceof Error ? err.message : "";
      if (message === "Already shared this tier for this period") {
        showToast(t("challengeCard.alreadySharedToast", { tier: t(`tier.${challenge.tier}`) }), "error");
      } else {
        showToast(t("challengeCard.shareErrorToast"), "error");
      }
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {periodLabel}
          </p> */}
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            {localizeChallengeField(t, challenge.id, "title", challenge.title)}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {localizeChallengeField(t, challenge.id, "description", challenge.description)}
          </p>
        </div>

        {challenge.tier ? (
          <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
            {t(`tier.${challenge.tier}`)}
          </span>
        ) : null}
      </div>

      {!challenge.implemented ? (
        <p className="mt-4 text-sm italic text-slate-400">{t("challengeCard.comingSoon")}</p>
      ) : (
        <>
          <ChallengeTier count={challenge.count} tiers={challenge.tiers} currentTier={challenge.tier} />
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{formatTimeRemaining(challenge.periodEnd, t)}</span>
              {challenge.nextTier ? (
                <span>
                  {(() => {
                    const tierLabel = t(`tier.${challenge.nextTier}`);
                    const fullText = t("challengeCard.moreForTier", { count: challenge.remainingToNext, tier: tierLabel });
                    const idx = fullText.indexOf(tierLabel);
                    if (idx === -1) return fullText;
                    return (
                      <>
                        {fullText.slice(0, idx)}
                        <span className="font-medium capitalize text-slate-700">{tierLabel}</span>
                        {fullText.slice(idx + tierLabel.length)}
                      </>
                    );
                  })()}
                </span>
              ) : (
                <span className="font-medium text-slate-700">{t("challengeCard.congratulations")}</span>
              )}
            </div>

            {challenge.tier ? (
              <button
                onClick={handleShare}
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                {t("challengeCard.shareAchievement")}
              </button>
            ) : null}
          </>
        )}
      </div>
    );
  }