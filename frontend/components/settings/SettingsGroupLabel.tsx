import { ReactNode } from "react";

export default function SettingsGroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 first:pt-0">
      {children}
    </p>
  );
}