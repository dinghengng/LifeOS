'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Rocket, BookOpen, ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface JoyrideTooltipProps {
  index: number;
  step: { title?: React.ReactNode; content?: React.ReactNode };
  backProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  primaryProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  skipProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  tooltipProps: React.HTMLAttributes<HTMLDivElement>;
  isLastStep: boolean;
  size: number;
}

interface JoyrideData {
  status: string;
  action: string;
  type: string;
}

const Joyride = dynamic(
  () => import('react-joyride').then((mod) => ({ default: mod.Joyride ?? mod })),
  { ssr: false }
) as React.ElementType;

const TOUR_DONE_KEY = 'lifeos-tour-done';

const CustomTooltip = ({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: JoyrideTooltipProps) => (
  <div
    {...tooltipProps}
    className="bg-slate-900 rounded-xl p-5 w-80 shadow-2xl border border-slate-700 font-sans"
    style={{ zIndex: 1000 }}
  >
    <div className="flex justify-between items-center mb-4">
      <button
        {...skipProps}
        className="text-slate-400 hover:text-white text-xs font-semibold bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded transition"
      >
        Skip Tutorial
      </button>
      <span className="text-slate-400 text-xs font-bold">
        {index + 1} / {size}
      </span>
    </div>
    <h3 className="text-emerald-400 font-bold text-lg mb-2">{step.title}</h3>
    <p className="text-slate-200 text-sm mb-6 leading-relaxed">{step.content}</p>
    <div className="flex justify-end gap-3">
      {index > 0 && (
        <button
          {...backProps}
          className="text-slate-300 hover:text-white text-sm font-semibold px-4 py-2 transition"
        >
          Back
        </button>
      )}
      <button
        {...primaryProps}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition"
      >
        {isLastStep ? 'Finish' : 'Next'}
      </button>
    </div>
  </div>
);

const tourSteps = [
  {
    target: 'body',
    placement: 'center',
    content: "LifeOS is your all-in-one personal OS! Tasks, goals, journaling, nutrition, supplements, and insights. Let's take a quick tour.",
    title: 'Welcome to LifeOS 🚀',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-navbar',
    placement: 'bottom',
    content: 'The navigation bar gives you access to every section of LifeOS.',
    title: 'Navigation',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-nav-tasks',
    placement: 'bottom',
    content: 'Manage everything you need to do. Create tasks, set priorities and due dates, and check them off as you go.',
    title: 'Tasks',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-tasks',
    placement: 'left',
    content: 'Your task board. Tasks are sortable by priority, due date, or status.',
    title: 'Task Board',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-add-task',
    placement: 'top',
    content: 'Quickly add a task: set a title, due date, and priority level in seconds.',
    title: 'Add a Task',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-priority-filter',
    placement: 'bottom',
    content: 'Filter your list by priority: Critical, High, Low, or view all at once.',
    title: 'Filter by Priority',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-navbar',
    content: 'Seamlessly navigate to the other pages from here. Hope you enjoy your stay!',
    title: 'Navigation',
    disableBeacon: true,
    disableScrolling: true,
  },
];

const FAQ_ITEMS = [
  {
    q: 'How does the wellness score work?',
    a: 'Your wellness score is calculated daily from five modules: Habits, Nutrition, Mood, Tasks, and Goals. Each contributes up to 20 points based on your activity that day. Check the Insights page for a full breakdown.',
  },
  {
    q: 'How do I log a meal without a barcode?',
    a: 'Go to Nutrition and use the search bar to find any food by name. You can adjust the serving size before logging. The barcode scanner is a shortcut for packaged foods only.',
  },
  {
    q: 'Why did my habit streak reset?',
    a: 'Streaks reset if you miss a day entirely. Streaks are calculated in Singapore Time (SGT), so make sure you log before midnight SGT.',
  },
  {
    q: 'Can I edit or delete a past journal entry?',
    a: "Yes. Open the Journal page, navigate to the past date using the date picker, and you can edit or delete that day's entry.",
  },
  {
    q: 'How do I export my data?',
    a: 'Scroll to the bottom of the Insights page. You can export Habits, Goals, Nutrition, and Supplements as CSV files for the last 30 days.',
  },
  {
    q: 'How do supplement streaks work?',
    a: "A supplement is counted as taken when you mark it for that day's AM or PM slot. Miss a slot and the streak for that supplement resets.",
  },
];

type View = 'home' | 'faq';

export default function HelpCentre() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('home');
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // auto-start for first-time users
  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem(TOUR_DONE_KEY)) {
      // Set immediately so a refresh mid-tour doesn't restart it
      localStorage.setItem(TOUR_DONE_KEY, '1');
      setRun(true);
    }
  }, []);

  // Freeze page scroll while tour overlay is active
  useEffect(() => {
    document.body.style.overflow = run ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [run]);

  const handleJoyrideCallback = (data: JoyrideData) => {
    if (['finished', 'skipped'].includes(data.status)) {
      setRun(false);
      localStorage.setItem(TOUR_DONE_KEY, '1');
    }
  };

  const startTour = () => {
    setOpen(false);
    setView('home');
    setTourKey(prev => prev + 1);
    setRun(true);
    // Mark as seen immediately so a refresh mid-tour doesn't restart it
    localStorage.setItem(TOUR_DONE_KEY, '1');
  };

  const handleClose = () => {
    setOpen(false);
    setView('home');
    setOpenFaq(null);
  };

  if (!mounted) return null;

  return (
    <>
      <Joyride
        key={tourKey}
        callback={handleJoyrideCallback}
        continuous
        run={run}
        steps={tourSteps}
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 999,
          },
        }}
      />
      <button
        onClick={() => setOpen(true)}
        className="fixed top-5 right-5 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 shadow-md transition-all"
        aria-label="Help centre"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-slate-600"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 pt-16 pr-5"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-xs shadow-2xl animate-in fade-in slide-in-from-top-4 max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >

            {/* ── HOME VIEW ── */}
            {view === 'home' && (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                  <h2 className="font-semibold text-base text-slate-800">Help centre</h2>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="py-2 overflow-y-auto flex-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-5 pt-4 pb-1">
                    Get started
                  </p>
                  <button
                    onClick={startTour}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Rocket size={16} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">Product tour</span>
                    <span className="ml-auto text-xs text-emerald-600 font-medium">Start tour →</span>
                  </button>

                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-5 pt-4 pb-1">
                    Reference
                  </p>
                  <button
                    onClick={() => setView('faq')}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <BookOpen size={16} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">FAQ</span>
                    <ChevronRight size={14} className="ml-auto text-slate-400" />
                  </button>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 shrink-0">
                  <p className="text-xs text-slate-400 text-center">LifeOS · Orbital 2026</p>
                </div>
              </>
            )}

            {/* ── FAQ VIEW ── */}
            {view === 'faq' && (
              <>
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 shrink-0">
                  <button
                    onClick={() => { setView('home'); setOpenFaq(null); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Back"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="font-semibold text-base text-slate-800">FAQ</h2>
                  <button onClick={handleClose} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 py-2">
                  {FAQ_ITEMS.map((item, i) => (
                    <div key={i} className="border-b border-slate-100 last:border-0">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="text-sm text-slate-700 leading-snug">{item.q}</span>
                        {openFaq === i
                          ? <ChevronUp size={14} className="text-slate-400 shrink-0" />
                          : <ChevronDown size={14} className="text-slate-400 shrink-0" />
                        }
                      </button>
                      {openFaq === i && (
                        <p className="px-5 pb-4 text-xs text-slate-500 leading-relaxed">
                          {item.a}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 border-t border-slate-100 shrink-0">
                  <p className="text-xs text-slate-400 text-center">LifeOS · Orbital 2026</p>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}