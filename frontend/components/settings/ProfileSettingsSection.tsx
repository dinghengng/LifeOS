"use client";
import { useState, useImperativeHandle, useEffect } from "react";
import { fetchMyUsername, setUsername as apiSetUsername } from "../../../shared/api";
import { useToastContext } from "../notifications/ToastContext";

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
  const showToast = useToastContext();

  useEffect(() => {
    fetchMyUsername().then((res) => {
      setCurrentUsername(res.username);
      if (res.username) setUsernameInput(res.username);
    });
  }, []);

  const handleSave = async (): Promise<{ username: string } | null> => {
    setError(null);
    const trimmed = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,30}$/.test(trimmed)) {
      setError("Username must be 2-30 characters (letters, numbers, underscore only)");
      return null;
    }
    setSaving(true);
    try {
      const result = await apiSetUsername(trimmed);
      setCurrentUsername(result.username);
      showToast(`Username set to @${result.username}`, "success"); 
      onSaved?.({ username: result.username });
      return { username: result.username };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save username");
      return null;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(saveRef, () => handleSave, [username]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="text-sm font-medium text-slate-700">Username</label>
      <p className="mt-1 text-xs text-slate-500">
        This is how other users will find and see you in Community search.
      </p>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsernameInput(e.target.value)}
        placeholder="e.g. jane_doe"
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!hideSaveButton && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : currentUsername ? "Update username" : "Set username"}
        </button>
      )}
    </div>
  );
}