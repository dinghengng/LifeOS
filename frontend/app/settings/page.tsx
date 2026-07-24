"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMoodConfig } from "../../../shared/api";
import { MoodLevelConfig } from "../../../shared/types";
import { SETTINGS_SECTIONS } from "../../../shared/settingsSection";
import MoodSettingsSection from "../../components/settings/MoodSettingsSection";
import NotificationSettingsSection from "../../components/settings/NotificationSettingsSection";
import NutritionGoalsSection from "../../components/settings/NutritionGoalsSection";
import ProfileSettingsSection from "../../components/settings/ProfileSettingsSection";
import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";
import LocalTabs from "../../components/layout/LocalTabs";
import { useTranslation } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import type { TranslationKey } from "../../context/translations";

const SECTION_COMPONENTS: Record<
  string,
  React.ComponentType<any>
> = {
  mood: MoodSettingsSection,
  notifications: NotificationSettingsSection,
  nutrition_goals: NutritionGoalsSection,
  profile: ProfileSettingsSection,
};

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const [configLoading, setConfigLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState(SETTINGS_SECTIONS[0].id);
  const [moodConfig, setMoodConfig] = useState<MoodLevelConfig[]>([]);
  const loading = authLoading || configLoading;

  // Redirect to landing if AuthContext finishes loading with no active session
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    const loadMoodConfig = async () => {
      try {
        const config = await fetchMoodConfig();
        setMoodConfig(config);
      } catch (err) {
        console.error("Failed to load mood config:", err);
      } finally {
        setConfigLoading(false);
      }
    };
    loadMoodConfig();
  }, [authLoading, user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
      return;
    }
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center">
        <p className="text-slate-400 text-sm">{t("settings.loading")}</p>
      </div>
    );
  }

  const activeSection = SETTINGS_SECTIONS.find((s) => s.id === activeSectionId);
  const ActiveComponent = SECTION_COMPONENTS[activeSectionId] ?? null;

  const tabItems = SETTINGS_SECTIONS.map((s) => ({ id: s.id, label: t(s.titleKey as TranslationKey) }));

  return (
    <AppShell>
      <AppHeader
        rightActions={
            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              {t("common.logout")}
            </button>
        }
      />

      <PageHeader
        eyebrow={new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-SG", { weekday: "long", day: "numeric", month: "long" })}
        title={t("settings.pageHeader.title")}
        description={t("settings.pageHeader.description")}
      />

      <LocalTabs items={tabItems} activeId={activeSectionId} onChange={setActiveSectionId} />
      <div>
        {activeSection && activeSectionId !== "nutrition_goals" ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">{t(activeSection.titleKey as TranslationKey)}</h2>
            <p className="mt-1 text-sm text-slate-500">{t(activeSection.descriptionKey as TranslationKey)}</p>
          </div>
        ) : null}

        {ActiveComponent ? (
          <ActiveComponent
            initialConfig={activeSectionId === "mood" ? moodConfig : undefined}
          />
        ) : (
          <p className="text-sm text-slate-400">{t("settings.sectionNotFound")}</p>
        )}
      </div>
    </AppShell>
  );
}