"use client";
import { useState, useImperativeHandle, useEffect } from "react";
import { fetchMyUsername, setUsername as apiSetUsername, fetchMyAvatar, setAvatar as apiSetAvatar } from "../../../shared/api";
import { useToastContext } from "../notifications/ToastContext";
import SettingsSectionCard from "./SettingsSectionCard";
import SettingsActionFooter from "./SettingsActionFooter";
import { useAvatar } from "../../context/AvatarContext";
import { useTranslation } from "../../context/LanguageContext";

const PEOPLE_EMOJIS = [
  "👨🏻", "👨🏼", "👨🏽", "👨🏾", "👨🏿",
  "👩🏻", "👩🏼", "👩🏽", "👩🏾", "👩🏿",
];
const ANIMAL_EMOJIS = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
  "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐻‍❄️", "🐤", "🐺", "🦋", "🐍",
];

interface ProfileSettingsSectionProps {
  onSaved?: (saved: { username: string }) => void;
  hideSaveButton?: boolean;
  saveRef?: React.RefObject<(() => Promise<{ username: string } | null>) | null>;
}

export default function ProfileSettingsSection({
  onSaved,
  hideSaveButton,
  saveRef,
}: ProfileSettingsSectionProps) {
  const [username, setUsernameInput] = useState("");
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { showToast } = useToastContext();
  const [avatarColor, setAvatarColor] = useState("#4f46e5");
  const [avatarEmoji, setAvatarEmojiState] = useState<string | null>(null);
  const { setAvatarLocal } = useAvatar();
  const { t } = useTranslation();

  useEffect(() => {
    fetchMyUsername().then((res) => {
      setCurrentUsername(res.username);
      if (res.username) setUsernameInput(res.username);
    }).finally(() => setProfileLoading(false));
    fetchMyAvatar().then((res) => {
      setAvatarColor(res.avatarColor);
      setAvatarEmojiState(res.avatarEmoji);
    }).catch(console.error);
  }, []);

  const handleSave = async (): Promise<{ username: string } | null> => {
    setError(null);
    const trimmed = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,30}$/.test(trimmed)) {
      setError(t("profileSettings.usernameError"));
      return null;
    }
    setSaving(true);
    try {
      const result = await apiSetUsername(trimmed);
      setCurrentUsername(result.username);
      await apiSetAvatar(avatarColor, avatarEmoji);
      showToast(t("profileSettings.toastUpdated"));
      setAvatarLocal(avatarColor, avatarEmoji);
      onSaved?.({ username: result.username });
      return { username: result.username };
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profileSettings.errorDefault"));
      showToast(t("profileSettings.toastSaveFailed"), "error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(saveRef, () => handleSave, [username, avatarColor, avatarEmoji]);

  const previewInitial = (currentUsername || username || "?").charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <SettingsSectionCard title={t("profileSettings.usernameTitle")}>
        <p className="mt-1 text-xs text-slate-500">
          {t("profileSettings.usernameDescription")}
        </p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder={t("profileSettings.usernamePlaceholder")}
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </SettingsSectionCard>

      <SettingsSectionCard title={t("profileSettings.avatarColourTitle")}>
        <p className="mt-1 text-xs text-slate-500">
          {t("profileSettings.avatarColourDescription")}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <label className="relative h-14 w-14 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow">
            <span className="absolute inset-0 rounded-full" style={{ background: avatarColor }} />
            <input
              type="color"
              value={avatarColor}
              onChange={(e) => setAvatarColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <span className="font-mono text-sm text-slate-500">{avatarColor}</span>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title={t("profileSettings.avatarEmojiTitle")}>
        <p className="mt-1 text-xs text-slate-500">
          {t("profileSettings.avatarEmojiDescription")}
        </p>
        <div className="mt-3 grid grid-cols-8 gap-2 sm:grid-cols-10">
          {[...PEOPLE_EMOJIS, ...ANIMAL_EMOJIS].map((em) => (
            <button
              key={em}
              onClick={() => setAvatarEmojiState(em)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition ${
                avatarEmoji === em
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
        {avatarEmoji && (
          <button
            onClick={() => setAvatarEmojiState(null)}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {t("profileSettings.clearEmoji")}
          </button>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard title={t("profileSettings.previewTitle")}>
        <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-semibold text-white"
            style={{ background: avatarColor }}
          >
            {avatarEmoji || previewInitial}
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsActionFooter
        onSave={handleSave}
        saving={saving || profileLoading}
        label={currentUsername ? t("profileSettings.updateProfile") : t("profileSettings.saveProfile")}
        error={error}
        hidden={hideSaveButton}
      />
    </div>
  );
}