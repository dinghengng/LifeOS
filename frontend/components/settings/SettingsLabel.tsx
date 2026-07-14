import { ReactNode } from "react";

export default function SettingsLabel({ children }: { children: ReactNode }) {
  return <div className="text-sm font-medium text-slate-800">{children}</div>;
}