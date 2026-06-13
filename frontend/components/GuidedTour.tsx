'use client';
import { useState } from 'react';
import { HelpCircle, X, Rocket, CheckSquare, Trophy, BookOpen, Salad } from 'lucide-react';
import { Joyride, Step, STATUS } from 'react-joyride';

const tourSteps: Step[] = [
  {
    target: 'body',
    content: 'LifeOS helps you track tasks, goals, journaling, and nutrition — all in one place.',
    title: 'Welcome to LifeOS',
    placement: 'center',
  },
  {
    target: '#tour-tasks',
    content: 'Stay on top of your daily to-dos. Check off tasks as you complete them to build momentum.',
    title: 'Task management',
  },
  {
    target: '#tour-dashboard',
    content: "Get a bird's-eye view of your progress and celebrate major milestones here.",
    title: 'Goals & milestones',
  },
  {
    target: '#tour-journal',
    content: 'Log your mood and answer custom prompts to track your mental well-being.',
    title: 'Lifestyle journaling',
  },
  {
    target: '#tour-nutrition',
    content: 'Log meals, track macros, and stay under your calorie ceiling.',
    title: 'Nutrition tracker',
  },
];

const helpSections = [
  {
    section: 'How to use',
    items: [
      { icon: Rocket, label: 'Getting started', tour: true },
      { icon: CheckSquare, label: 'Tasks & goals', tour: false },
      { icon: Trophy, label: 'Milestones', tour: false },
    ],
  },
  {
    section: 'Reference',
    items: [
      { icon: BookOpen, label: 'FAQ', tour: false },
      { icon: Salad, label: 'Nutrition guide', tour: false },
    ],
  },
];

export default function HelpCentre() {
  const [open, setOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);

  const handleCallback = (data: { status: string }) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRunTour(false);
    }
  };

  const startTour = () => {
    setOpen(false);     // make tour targets visible
    setRunTour(true);
  };

  return (
    <>
      <Joyride
        callback={handleCallback}
        continuous
        run={runTour}
        scrollToFirstStep
        showProgress
        showSkipButton
        disableBeacon
        steps={tourSteps}
        styles={{
          options: {
            arrowColor: '#1e293b',
            backgroundColor: '#1e293b',
            overlayColor: 'rgba(0,0,0,0.7)',
            primaryColor: '#10b981',
            textColor: '#f8fafc',
            zIndex: 1000,
          },
          buttonNext: { borderRadius: '8px', fontWeight: 'bold' },
          buttonSkip: { color: '#94a3b8' },
        }}
      />

      {/* Pending changes, */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Help centre"
      >
        <HelpCircle size={22} className="text-slate-500" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-base">Help centre</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Sections */}
            <div className="py-2">
              {helpSections.map(({ section, items }) => (
                <div key={section}>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-5 pt-4 pb-1">
                    {section}
                  </p>
                  {items.map(({ icon: Icon, label, tour }) => (
                    <button
                      key={label}
                      onClick={tour ? startTour : undefined}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Icon size={16} className="text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700">{label}</span>
                      {tour && (
                        <span className="ml-auto text-xs text-emerald-600 font-medium">Start tour →</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">LifeOS · Orbital 2026</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}