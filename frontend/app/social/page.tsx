"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchChallenges, searchUsers, fetchProfile, fetchProfilePosts, } from "../../../shared/api";
import { ChallengeProgress, UserSearchResult, PublicProfile, ProfilePost, } from "../../../shared/types";
import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";
import LocalTabs from "../../components/layout/LocalTabs";
import ChallengeCard from "../../components/challenges/ChallengeCard";
import ProfileCard from "../../components/social/ProfileCard";
import ProfileSetupModal from "../../components/social/ProfileSetupModal";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";

export default function ChallengesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, locale } = useTranslation();

  const SOCIAL_TABS = [
    { id: "challenges", label: t("social.tabChallenges") },
    { id: "profile", label: t("social.tabProfile") },
    { id: "community", label: t("social.tabCommunity") },
  ];

  const [activeTab, setActiveTab] = useState<string>(SOCIAL_TABS[0].id);

  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [myPosts, setMyPosts] = useState<ProfilePost[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Same redirect pattern as TasksPage 
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const loadChallenges = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const data = await fetchChallenges();
      setChallenges(data);
    } catch (err) {
      console.error(err);
      setError(t("social.errorLoadChallenges"));
    } finally {
      setDataLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!authLoading && user && activeTab === "challenges") loadChallenges();
  }, [authLoading, user, activeTab, loadChallenges]);

  const loadMyProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const [profileData, postsData] = await Promise.all([
        fetchProfile(String(user.id)).catch(() => null),
      fetchProfilePosts(String(user.id)).catch(() => []),
      ]);
      setMyProfile(profileData);
      setMyPosts(postsData);
      const isDefaultAvatar =
      !profileData ||
      (profileData.avatarColor === "#4f46e5" && !profileData.avatarEmoji);

      if (isDefaultAvatar) setShowProfileSetup(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user && activeTab === "profile") loadMyProfile();
  }, [authLoading, user, activeTab, loadMyProfile]);

  const handleKudosChange = (postId: number, kudosCount: number, hasKudosed: boolean) => {
    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, kudosCount, hasKudosed } : p))
    );
  };

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await searchUsers(value.trim());
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-400">{t("social.loading")}</p>
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
            {t("nav.logout")}
          </button>
        }
      />

      <PageHeader
        eyebrow={new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-SG", { weekday: "long", day: "numeric", month: "long" })}
        title={t("social.title")}
        description={t("social.description")}
      />

      <LocalTabs items={SOCIAL_TABS} activeId={activeTab} onChange={setActiveTab} />

        {activeTab === "challenges" && (
          <>
            {error && <p className="mb-4 text-sm text-red-600 text-center">{error}</p>}
            {dataLoading ? (
              <p className="text-center text-sm text-slate-500 mt-4">{t("social.loadingChallenges")}</p>
            ) : challenges.length === 0 ? (
              <p className="text-center text-sm text-slate-500 mt-4">
                {t("social.noChallenges")}
              </p>
            ) : (
              <div className="flex flex-col gap-8">
                {weeklyChallenges.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("social.weekly")}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {weeklyChallenges.map((c) => (
                        <ChallengeCard key={c.id} challenge={c} />
                      ))}
                    </div>
                  </section>
                )}
                {monthlyChallenges.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("social.monthly")}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {monthlyChallenges.map((c) => (
                        <ChallengeCard key={c.id} challenge={c} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* Profile tab */}
        {activeTab === "profile" && (
          <>
            {showProfileSetup && (
              <ProfileSetupModal
                onComplete={() => {
                  setShowProfileSetup(false);
                  loadMyProfile();
                }}
                onSkip={() => setShowProfileSetup(false)}
              />
            )}
            {profileLoading ? (
              <p className="text-center text-sm text-slate-500 mt-4">{t("social.loadingProfile")}</p>
            ) : myProfile ? (
              <ProfileCard
                name={myProfile.name}
                username={myProfile.username}
                avatarColor={myProfile.avatarColor}
                avatarEmoji={myProfile.avatarEmoji}
                posts={myPosts}
                isOwnProfile={true}
                onKudosChange={handleKudosChange}
              />
            ) : (
              <p className="text-center text-sm text-slate-500 mt-4">
                {t("social.setUsernamePrompt")}
              </p>
            )}
          </>
        )}

        {/* Community tab */}
        {activeTab === "community" && (
          <div>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t("social.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-4 flex flex-col gap-2">
              {searchLoading && <p className="text-sm text-slate-400">{t("social.searching")}</p>}
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => router.push(`/profile/${u.id}`)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: u.avatarColor }}
                  >
                    {u.avatarEmoji || u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.name || u.username}</p>
                    <p className="text-xs text-slate-500">@{u.username}</p>
                  </div>
                </button>
              ))}
              {!searchLoading && query.trim() && results.length === 0 && (
                <p className="text-sm text-slate-400">{t("social.noUsersFound")}</p>
              )}
            </div>
          </div>
        )}
      </AppShell>
    );
  }