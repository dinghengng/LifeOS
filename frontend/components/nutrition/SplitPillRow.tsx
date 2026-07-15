"use client";

import { ReactNode } from "react";

interface SplitPillRowProps {
  left: ReactNode;
  right: ReactNode;
}

export default function SplitPillRow({ left, right }: SplitPillRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {left}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {right}
      </div>
    </div>
  );
}