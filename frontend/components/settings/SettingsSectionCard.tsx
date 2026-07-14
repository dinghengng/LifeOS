import { ReactNode } from "react";

interface SettingsSectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SettingsSectionCard({
  title,
  description,
  children,
  className = "",
}: SettingsSectionCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 ${className}`}>
      {(title || description) && (
        <div className="mb-3">
          {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}