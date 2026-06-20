"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuthStatus, fetchMoodConfig, logoutUser } from "../../../shared/api";
import { User, MoodLevelConfig } from "../../../shared/types";
import { SETTINGS_SECTIONS } from "../../../shared/settingsSection";
import MoodSettingsSection from "../../components/settings/MoodSettingsSection";
import NotificationSettingsSection from "../../components/settings/NotificationSettingsSection";
import NutritionGoalsSection from "../../components/settings/NutritionGoalsSection";
import Navbar from "../../components/Navbar";

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
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "inherit" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px 12px",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "white",
      }}>
        <div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            {new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>Settings</div>
        </div>
        <Navbar onLogout={handleLogout} />
      </div>

      <div style={{ display: "flex", maxWidth: 900, margin: "0 auto", padding: "32px 24px", gap: 32 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSectionId(section.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: activeSectionId === section.id ? "#ede9fe" : "transparent",
                color: activeSectionId === section.id ? "#4f46e5" : "#475569",
                fontWeight: activeSectionId === section.id ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 4,
                transition: "all 0.15s ease",
              }}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div style={{
          flex: 1,
          backgroundColor: "white",
          borderRadius: 12,
          padding: "28px 32px",
          border: "1px solid #e2e8f0",
        }}>
          {activeSection && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {activeSection.title}
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
                {activeSection.description}
              </p>
            </div>
          )}
          {ActiveComponent ? (
            <ActiveComponent
              initialConfig={activeSectionId === "mood" ? moodConfig : undefined}
            />
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Section not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}