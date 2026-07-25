"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { ProfilePost } from "../../../shared/types";
import { toggleKudos } from "../../../shared/api";
import { useTranslation } from "../../context/LanguageContext";

const TIER_COLORS: Record<string, string> = {
  bronze: "#B08D57",
  silver: "#9CA3AF",
  gold: "#D4AF37",
};

interface AchievementPostProps {
  post: ProfilePost;
  isOwnPost: boolean;
  onKudosChange: (postId: number, kudosCount: number, hasKudosed: boolean) => void;
}

export function AchievementPost({ post, isOwnPost, onKudosChange }: AchievementPostProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKudos = async () => {
    if (isOwnPost || isSubmitting) return;

    const prevCount = post.kudosCount;
    const prevHasKudosed = post.hasKudosed;
    const optimisticHasKudosed = !prevHasKudosed;
    const optimisticCount = optimisticHasKudosed ? prevCount + 1 : prevCount - 1;

    onKudosChange(post.id, optimisticCount, optimisticHasKudosed);
    setIsSubmitting(true);

    try {
      const result = await toggleKudos(post.id);
      onKudosChange(post.id, result.kudosCount, result.hasKudosed);
    } catch (err) {
      console.error(err);
      onKudosChange(post.id, prevCount, prevHasKudosed); // rollback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[post.tier] }} />
        <span className="text-sm font-medium capitalize text-slate-700">
          {t(`tier.${post.tier}`)} — {post.challengeTitle}
        </span>
      </div>
      <button
        onClick={handleKudos}
        disabled={isOwnPost || isSubmitting}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
          post.hasKudosed ? "bg-indigo-100 text-indigo-700" : "bg-white text-slate-500 hover:bg-slate-100"
        } ${isOwnPost ? "cursor-not-allowed opacity-50" : ""}`}
        title={isOwnPost ? t("achievementPost.cantKudosOwnPost") : post.hasKudosed ? t("achievementPost.removeKudos") : t("achievementPost.giveKudos")}
      >
        <ThumbsUp size={14} fill={post.hasKudosed ? "currentColor" : "none"} />
        {post.kudosCount}
      </button>
    </div>
  );
}