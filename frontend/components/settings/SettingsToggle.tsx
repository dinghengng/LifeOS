interface SettingsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function SettingsToggle({ checked, onChange, label, disabled }: SettingsToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
        checked ? "bg-indigo-600" : "bg-slate-200",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform"
        style={{
          height: 18,
          width: 18,
          transform: checked ? "translateX(22px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}