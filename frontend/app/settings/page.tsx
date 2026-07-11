"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuthStatus, fetchMoodConfig, logoutUser } from "../../../shared/api";
import { User, MoodLevelConfig } from "../../../shared/types";
import { SETTINGS_SECTIONS } from "../../../shared/settingsSection";
import MoodSettingsSection from "../../components/settings/MoodSettingsSection";
import NotificationSettingsSection from "../../components/settings/NotificationSettingsSection";
import NutritionGoalsSection from "../../components/settings/NutritionGoalsSection";
//import Navbar from "../../components/Navbar";
import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";

const SECTION_COMPONENTS: Record<
  string,
  React.ComponentType<{ initialConfig?: MoodLevelConfig[] }>
> = {
  mood: MoodSettingsSection,
  notifications: NotificationSettingsSection,
  nutrition_goals: NutritionGoalsSection,
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState(SETTINGS_SECTIONS[0].id);
  const [moodConfig, setMoodConfig] = useState<MoodLevelConfig[]>([]);
  

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) { router.push("/"); return; }
      setUser(currentUser);
      try {
        const config = await fetchMoodConfig();
        setMoodConfig(config);
      } catch (err) {
        console.error("Failed to load mood config:", err);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  const activeSection = SETTINGS_SECTIONS.find((s) => s.id === activeSectionId);
  const ActiveComponent = SECTION_COMPONENTS[activeSectionId] ?? null;

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
        eyebrow={new Date().toLocaleDateString("en-SG", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title="Settings"
        description="Manage your preferences, mood customisation, and notification behaviour across LifeOS."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:flex-shrink-0">
          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = activeSectionId === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={[
                    "w-full rounded-2xl px-4 py-3 text-left text-sm transition-colors",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <div className="font-medium">{section.title}</div>
                  <div
                    className={[
                      "mt-1 text-xs",
                      isActive ? "text-slate-300" : "text-slate-400",
                    ].join(" ")}
                  >
                    {section.description}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {activeSection ? (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {activeSection.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeSection.description}
              </p>
            </div>
          ) : null}

          {ActiveComponent ? (
            <ActiveComponent
              initialConfig={activeSectionId === "mood" ? moodConfig : undefined}
            />
          ) : (
            <p className="text-sm text-slate-400">Section not found.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}