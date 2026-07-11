import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>

        {description ? (
          <p className="mt-3 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </section>
  );
}