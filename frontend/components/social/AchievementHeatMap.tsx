"use client";

import { useState, useMemo } from "react";
import { ProfilePost } from "../../../shared/types";
import { AchievementPost } from "./AchievementPost";

const TIER_COLORS: Record<string, string> = {
  bronze: "#E8965A",
  silver: "#C7D2E0",
  gold: "#FFD147",
};

const TIER_GLOW: Record<string, string> = {
  bronze: "linear-gradient(135deg, #FFB77D, #D9773A)",
  silver: "linear-gradient(135deg, #F1F5FA, #A8B7CC)",
  gold: "linear-gradient(135deg, #FFEA9E, #F5B700)",
};

const EMPTY_COLOR = "#EDF1F5";

function getSGTDateStr(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(date);
}

function getWeekStartSGT(date: Date): Date {
  const [y, m, d] = getSGTDateStr(date).split("-").map(Number);
  const dayUTC = new Date(Date.UTC(y, m - 1, d));
  const dow = dayUTC.getUTCDay();
  const mondayOffset = (dow + 6) % 7;
  dayUTC.setUTCDate(dayUTC.getUTCDate() - mondayOffset);
  return dayUTC;
}

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startLabel = new Date(start).toLocaleDateString(undefined, opts);
  const inclusiveEnd = new Date(new Date(end).getTime() - 24 * 60 * 60 * 1000);
  const endLabel = inclusiveEnd.toLocaleDateString(undefined, opts);
  return `${startLabel}–${endLabel}`;
}

function getMondaysInMonth(year: number, month: number): Date[] {
  const mondays: Date[] = [];
  const cursor = new Date(Date.UTC(year, month, 1));
  const nextMonthStart = new Date(Date.UTC(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, 1));
  while (cursor < nextMonthStart) {
    if (cursor.getUTCDay() === 1) mondays.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return mondays;
}

function getMondaysInYear(year: number): Date[] {
  const mondays: Date[] = [];
  const cursor = new Date(Date.UTC(year, 0, 1));
  const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));
  while (cursor < nextYearStart) {
    if (cursor.getUTCDay() === 1) mondays.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return mondays;
}

interface ChallengeRow {
  challengeId: string;
  challengeTitle: string;
  cells: (ProfilePost | null)[];
}

interface AchievementHeatmapProps {
  posts: ProfilePost[];
  isOwnProfile: boolean;
  onKudosChange: (postId: number, kudosCount: number, hasKudosed: boolean) => void;
}

export default function AchievementHeatmap({ posts, isOwnProfile, onKudosChange }: AchievementHeatmapProps) {
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null);

  const now = new Date();
  const [currentYear, currentMonth] = getSGTDateStr(now).split("-").map(Number);

  const weekStarts = useMemo(() => {
    if (viewMode === "year") return getMondaysInYear(currentYear);
    return getMondaysInMonth(currentYear, currentMonth - 1);
  }, [viewMode, currentYear, currentMonth]);

  const rows: ChallengeRow[] = useMemo(() => {
    const byChallenge = new Map<string, { title: string; posts: ProfilePost[] }>();
    for (const post of posts) {
      const existing = byChallenge.get(post.challengeId);
      if (existing) {
        existing.posts.push(post);
      } else {
        byChallenge.set(post.challengeId, { title: post.challengeTitle, posts: [post] });
      }
    }

    return Array.from(byChallenge.entries()).map(([challengeId, { title, posts: challengePosts }]) => {
      const cells = weekStarts.map((weekStart) => {
        const match = challengePosts.find((p) => {
          const postWeekStart = getWeekStartSGT(new Date(p.periodStart));
          return postWeekStart.getTime() === weekStart.getTime();
        });
        return match ?? null;
      });
      return { challengeId, challengeTitle: title, cells };
    });
  }, [posts, weekStarts]);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">No achievements shared yet.</p>;
  }

  const monthLabel = now.toLocaleDateString(undefined, { month: "long", timeZone: "Asia/Singapore" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {viewMode === "month" ? monthLabel : currentYear}
        </p>
        <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5">
          <button
            onClick={() => setViewMode("month")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              viewMode === "month" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            This month
          </button>
          <button
            onClick={() => setViewMode("year")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              viewMode === "year" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-x-auto">
        {rows.map((row) => (
          <div key={row.challengeId} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-600" title={row.challengeTitle}>
              {row.challengeTitle}
            </span>
            <div className="flex gap-[3px]">
              {row.cells.map((post, i) => {
                const isEmpty = !post;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isEmpty}
                    onClick={() => post && setSelectedPost(post)}
                    title={post ? `${post.tier} · ${formatRange(post.periodStart, post.periodEnd)}` : undefined}
                    className={`h-3.5 w-3.5 shrink-0 rounded-sm transition-transform ${
                      isEmpty ? "cursor-default" : "cursor-pointer hover:scale-125"
                    }`}
                    style={{ backgroundColor: post ? TIER_COLORS[post.tier] : EMPTY_COLOR }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <AchievementPost
              post={selectedPost}
              isOwnPost={isOwnProfile}
              onKudosChange={(postId, kudosCount, hasKudosed) => {
                onKudosChange(postId, kudosCount, hasKudosed);
                setSelectedPost((prev) => (prev && prev.id === postId ? { ...prev, kudosCount, hasKudosed } : prev));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}