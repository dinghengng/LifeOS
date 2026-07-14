import { ReactNode } from "react";

export default function SettingsHint({ children }: { children: ReactNode }) {
  return <p className="mt-0.5 text-xs text-slate-500">{children}</p>;
}