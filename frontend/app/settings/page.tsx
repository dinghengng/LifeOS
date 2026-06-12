"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuthStatus, fetchMoodConfig, logoutUser } from "../../../shared/api";
import { User, MoodLevelConfig } from "../../../shared/types";
import { SETTINGS_SECTIONS } from "../../../shared/settingsSection";
import MoodSettingsSection from "../../components/settings/MoodSettingsSection";

const SECTION_COMPONENTS: Record<
  string,
  React.ComponentType<{ initialConfig?: MoodLevelConfig[] }>
> = {
  mood: MoodSettingsSection,
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
    <div className="min-h-screen bg-[#f5f5f2]" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-white/70 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
        <div className="flex gap-2">
          {[
            { label: "Tasks",     path: "/" },
            { label: "Dashboard", path: "/dashboard" },
            { label: "Journal",   path: "/journal" },
            { label: "Nutrition", path: "/nutrition" },
          ].map(({ label, path }) => (
            <button
              key={label}
              onClick={() => router.push(path)}
              className="px-4 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white/70 text-slate-600 hover:bg-white transition"
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white/70 text-slate-600 hover:bg-white transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex max-w-4xl mx-auto mt-8 gap-6 px-6 pb-16">
        <aside className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                  activeSectionId === section.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:bg-white hover:text-slate-800"
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {activeSection && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800">{activeSection.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{activeSection.description}</p>
            </div>
          )}
          {ActiveComponent ? (
            <ActiveComponent
              initialConfig={activeSectionId === "mood" ? moodConfig : undefined}
            />
          ) : (
            <p className="text-sm text-slate-400">Section not found.</p>
          )}
        </main>
      </div>
    </div>
  );
}