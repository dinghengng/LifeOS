import { ChallengeProgress } from "../../../shared/types";
import ChallengeTier from "./ChallengeTier";

interface ChallengeCardProps {
  challenge: ChallengeProgress;
}

function formatTimeRemaining(periodEnd: string): string {
  const end = new Date(periodEnd).getTime();
  const now = Date.now();
  const diffMs = end - now;
  if (diffMs <= 0) return "Resetting soon";

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const periodLabel = challenge.period === "weekly" ? "Weekly" : "Monthly";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {periodLabel}
          </p> */}
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            {challenge.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{challenge.description}</p>
        </div>

        {challenge.tier ? (
          <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
            {challenge.tier}
          </span>
        ) : null}
      </div>

      {!challenge.implemented ? (
        <p className="mt-4 text-sm italic text-slate-400">Coming soon</p>
      ) : (
        <>
          <ChallengeTier
            count={challenge.count}
            tiers={challenge.tiers}
            currentTier={challenge.tier}
          />

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>{formatTimeRemaining(challenge.periodEnd)}</span>
            {challenge.nextTier ? (
              <span>
                {challenge.remainingToNext} more for{" "}
                <span className="font-medium capitalize text-slate-700">
                  {challenge.nextTier}
                </span>
              </span>
            ) : (
              <span className="font-medium text-slate-700">Congratulations!</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}