'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Rocket, CheckSquare, Trophy, BookOpen, Salad } from 'lucide-react';

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

// Changing to dark theme but might check against preferences
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
    content: 'LifeOS helps you track tasks, goals, journaling, and nutrition — all in one place. Let\'s take a quick look at the Tasks page!',
    title: 'Welcome to LifeOS 🚀',
    placement: 'center',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-tasks',
    content: 'This is your task board. Add new tasks, set priorities, and check them off as you go.',
    title: 'Your Tasks',
    disableBeacon: true,
    disableScrolling: true,
    placement: 'left',
  },
  {
    target: '#tour-add-task',
    content: 'Use this form to quickly add a new task. You can set a due date and priority level.',
    title: 'Add a Task',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-priority-filter',
    content: 'Filter your tasks by priority — Critical, High, Low, or view all at once.',
    title: 'Filter by Priority',
    disableBeacon: true,
    disableScrolling: true,
  },
  {
    target: '#tour-navbar',
    content: 'Navigate to Dashboard, Journal, and Nutrition from here. Each section has its own tour when you get there!',
    title: 'Navigation',
    disableBeacon: true,
    disableScrolling: true,
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
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  useEffect(() => {
    if (run) {
      document.body.style.overflow = 'hidden'; // Freeze page
    } else {
      document.body.style.overflow = 'unset';  
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [run]);

  const handleJoyrideCallback = (data: JoyrideData) => {
    if (['finished', 'skipped'].includes(data.status)) {
      setRun(false);
    }
  };

  const startTour = () => {
    setOpen(false);
    setTourKey(prev => prev + 1);
    setRun(true);
  };

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
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-xs shadow-2xl animate-in fade-in slide-in-from-top-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-base text-slate-800">Help centre</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

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
                        <span className="ml-auto text-xs text-emerald-600 font-medium">
                          Start tour →
                        </span>
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