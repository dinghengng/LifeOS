"use client";

import { useState } from "react";
import AppShell from "../../components/layout/AppShell";
import AppHeader from "../../components/layout/AppHeader";
import PageHeader from "../../components/layout/PageHeader";
import LocalTabs from "../../components/layout/LocalTabs";

const tabs = [
  { id: "profile", label: "Profile", count: 1 },
  { id: "notifications", label: "Notifications", count: 3 },
  { id: "mood", label: "Mood", count: 2 },
  { id: "nutrition", label: "Nutrition Goals", count: 1 },
];

function PreviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 text-sm text-slate-600">{children}</div>
    </section>
  );
}

export default function UIPreviewPage() {
  const [activeTab, setActiveTab] = useState("notifications");

  return (
    <AppShell>
      <AppHeader />

      <PageHeader
        eyebrow="Wednesday, 8 July"
        title="Settings"
        description="Previewing the shared shell, page header, and local tab system for LifeOS."
        actions={
          <>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Secondary action
            </button>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Primary action
            </button>
          </>
        }
      />

      <LocalTabs items={tabs} activeId={activeTab} onChange={setActiveTab} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <PreviewCard title="Section content">
            <p>
              This is fake content for the active tab. Use this page to judge spacing,
              header weight, navigation hierarchy, and whether the active states feel
              consistent.
            </p>
          </PreviewCard>

          <PreviewCard title="Form preview">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700"
                placeholder="Display name"
              />
              <input
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700"
                placeholder="Email"
              />
              <select className="w-full rounded-xl border-r-8 border-transparent bg-white pl-3 pr-4 py-2.5 text-sm text-slate-700 outline outline-1 outline-slate-300">
                <option>Daily reminders</option>
              </select>

              <select className="w-full rounded-xl border-r-8 border-transparent bg-white pl-3 pr-4 py-2.5 text-sm text-slate-700 outline outline-1 outline-slate-300">
                <option>30 minutes before</option>
              </select>
            </div>
          </PreviewCard>
        </div>

        <div className="space-y-4">
          <PreviewCard title="Side info">
            <p>Use this area to test secondary panels, summaries, or helper text.</p>
          </PreviewCard>

          <PreviewCard title="Hierarchy checklist">
            <ul className="list-disc space-y-1 pl-5">
              <li>Can you immediately tell global nav from local tabs?</li>
              <li>Does the page title feel like the primary focus?</li>
              <li>Is the header too heavy or too weak?</li>
              <li>Does the content still breathe on mobile?</li>
            </ul>
          </PreviewCard>
        </div>
      </div>
    </AppShell>
  );
}