import { useTranslation } from "../../context/LanguageContext";

interface ChallengeTierProps {
  count: number;
  tiers: { bronze: number; silver: number; gold: number };
  currentTier: "bronze" | "silver" | "gold" | null;
}

const TIER_COLORS: Record<"bronze" | "silver" | "gold", string> = {
  bronze: "#B08D57",
  silver: "#9CA3AF",
  gold: "#D4AF37",
};

const TIER_ORDER: Array<"bronze" | "silver" | "gold"> = ["bronze", "silver", "gold"];

export default function ChallengeTier({ count, tiers, currentTier }: ChallengeTierProps) {
  const { t } = useTranslation();
  const maxTarget = tiers.gold;
  const pct = Math.min(100, Math.round((count / maxTarget) * 100));

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{t("challengeTier.logged", { count })}</span>
        <span>{t("challengeTier.forTier", { count: maxTarget, tier: t("tier.gold") })}</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: currentTier ? TIER_COLORS[currentTier] : "#CBD5E1",
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        {TIER_ORDER.map((tier) => {
          const isEarned = currentTier
            ? TIER_ORDER.indexOf(tier) <= TIER_ORDER.indexOf(currentTier)
            : false;

          return (
            <div key={tier} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: isEarned ? TIER_COLORS[tier] : "#E2E8F0",
                }}
              />
              <span
                className={[
                  "text-xs capitalize",
                  isEarned ? "font-semibold text-slate-800" : "text-slate-400",
                ].join(" ")}
              >
                {t(`tier.${tier}`)} ({tiers[tier]})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}