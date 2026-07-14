import { ReactNode } from "react";
import SettingsLabel from "./SettingsLabel";
import SettingsHint from "./SettingsHint";

interface SettingsRowProps {
  label: string;
  hint?: string;
  children: ReactNode;
  direction?: "row" | "column";
  emphasis?: boolean;
  noBorder?: boolean;
}

export default function SettingsRow({
  label,
  hint,
  children,
  direction = "row",
  emphasis = false,
  noBorder = false,
}: SettingsRowProps) {
  return (
    <div
      className={[
        "flex gap-3 py-3.5",
        noBorder ? "" : "border-b border-slate-100 last:border-b-0",
        direction === "row" ? "items-center justify-between" : "flex-col items-start",
        emphasis ? "rounded-xl bg-slate-50 px-3" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <SettingsLabel>{label}</SettingsLabel>
        {hint && <SettingsHint>{hint}</SettingsHint>}
      </div>
      <div className={direction === "column" ? "w-full" : "flex-shrink-0"}>{children}</div>
    </div>
  );
}