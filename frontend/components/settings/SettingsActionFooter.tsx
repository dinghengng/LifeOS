import { useTranslation } from "../../context/LanguageContext";

interface SettingsActionFooterProps {
  onSave: () => void;
  saving: boolean;
  label?: string;
  error?: string | null;
  hidden?: boolean;
}

export default function SettingsActionFooter({
  onSave,
  saving,
  label,
  error,
  hidden = false,
}: SettingsActionFooterProps) {
  const { t } = useTranslation();
  if (hidden) return null;
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? t("settingsCommon.saving") : label ?? t("settingsCommon.saveChanges")}
      </button>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}