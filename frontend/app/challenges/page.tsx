"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { checkAuthStatus, logoutUser, fetchChallenges } from "../../../shared/api";
import { User, ChallengeProgress } from "../../../shared/types";
import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";
import ChallengeCard from "../../components/challenges/ChallengeCard";

export default function ChallengesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    };
    init();
  }, [router]);

  const loadChallenges = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const data = await fetchChallenges();
      setChallenges(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load challenges. Please try again.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) loadChallenges();
  }, [authLoading, loadChallenges]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
    router.push("/");
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </main>
    );
  }

  const weeklyChallenges = challenges.filter((c) => c.period === "weekly");
  const monthlyChallenges = challenges.filter((c) => c.period === "monthly");

  return (
    <AppShell>
      <AppHeader
        rightActions={
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        }
      />

      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}
        title="Challenges"
        description="Complete challenges each week to earn medals that you can show off"
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
      ) : null}

      {dataLoading ? (
        <p className="text-center text-sm text-slate-500 mt-4">Loading challenges…</p>
      ) : challenges.length === 0 ? (
        <p className="text-center text-sm text-slate-500 mt-4">
          No challenges available right now.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {weeklyChallenges.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Weekly
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {weeklyChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </section>
          ) : null}

          {monthlyChallenges.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Monthly
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {monthlyChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}