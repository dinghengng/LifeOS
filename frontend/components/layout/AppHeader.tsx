"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import GlobalNav from "./GlobalNav";
import NotificationBell from "../notifications/NotificationBell";
import { useTranslation } from "../../context/LanguageContext";
import { useAvatar } from "../../context/AvatarContext";
import { fetchMyUsername } from "../../../shared/api";

interface AppHeaderProps {
  rightActions?: React.ReactNode;
}

export default function AppHeader({ rightActions }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { avatarColor, avatarEmoji } = useAvatar();
  const [username, setUsername] = useState<string | null>(null);
  const isSettingsActive = pathname === "/settings";

  useEffect(() => {
    fetchMyUsername()
      .then((res) => setUsername(res.username))
      .catch(console.error);
  }, []);
  const initial = username?.charAt(0).toUpperCase() ?? "L";

  return (
    <header id="tour-navbar" className="sticky top-0 z-20 mb-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold text-white"
            style={{ background: avatarColor }}
          >
            {avatarEmoji || initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("appHeader.brand")}</p>
            <p className="text-xs text-slate-500">{t("appHeader.tagline")}</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <GlobalNav />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => router.push("/settings")}
            title={t("appHeader.settings")}
            aria-label={t("appHeader.settings")}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border transition-colors"
            style={{
              borderColor: "var(--color-border-secondary)",
              backgroundColor: isSettingsActive ? "#4f46e5" : "rgba(255,255,255,0.7)",
              color: isSettingsActive ? "#ffffff" : "#64748b",
            }}
          >
            <Settings size={16} />
          </button>

          {rightActions ?? (
            <>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                {t("appHeader.help")}
              </button>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                {t("appHeader.account")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}