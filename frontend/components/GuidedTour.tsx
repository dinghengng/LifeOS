"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Rocket,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

interface TourStep {
  target: string;
  placement?: string;
  content: React.ReactNode;
  title?: React.ReactNode;
  disableBeacon?: boolean;
  disableScrolling?: boolean;
  data?: { bridge?: boolean; route?: string };
}

interface JoyrideTooltipProps {
  index: number;
  step: TourStep;
  backProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  primaryProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  skipProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  tooltipProps: React.HTMLAttributes<HTMLDivElement>;
  isLastStep: boolean;
  size: number;

  globalIndex?: number;
  globalTotal?: number;
  onBridgeNavigate?: () => void;
}

interface JoyrideData {
  status: string;
  action: string;
  type: string;
}

const Joyride = dynamic(
  () =>
    import("react-joyride").then((mod) => ({ default: mod.Joyride ?? mod })),
  { ssr: false },
) as React.ElementType;

const TOUR_DONE_KEY = "lifeos-tour-done";

// Order the tour walks through pages in.
const TOUR_ROUTE_ORDER = [
  "/",
  "/dashboard",
  "/journal",
  "/nutrition",
  "/insights",
  "/social",
  "/settings",
];

function CustomTooltip({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
  globalIndex,
  globalTotal,
  onBridgeNavigate,
}: JoyrideTooltipProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const isBridgeStep = !!step.data?.bridge;
  const displayIndex = globalIndex ?? index;
  const displayTotal = globalTotal ?? size;

  // Bridge steps still fire Joyride's own onClick
  const handlePrimaryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    primaryProps.onClick?.(e);
    if (isBridgeStep && step.data?.route) {
      const targetRoute = step.data.route;
      onBridgeNavigate?.();
      setTimeout(() => router.push(targetRoute), 0);
    }
  };

  return (
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
          {t("helpCentre.tour.skip")}
        </button>
        <span className="text-slate-400 text-xs font-bold">
          {displayIndex + 1} / {displayTotal}
        </span>
      </div>
      <h3 className="text-emerald-400 font-bold text-lg mb-2">{step.title}</h3>
      <p className="text-slate-200 text-sm mb-6 leading-relaxed">
        {step.content}
      </p>

      <div className="flex justify-end gap-3">
        {index > 0 && !isBridgeStep && (
          <button
            {...backProps}
            className="text-slate-300 hover:text-white text-sm font-semibold px-4 py-2 transition"
          >
            {t("helpCentre.tour.back")}
          </button>
        )}
        <button
          {...primaryProps}
          onClick={handlePrimaryClick}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition"
        >
          {isBridgeStep
            ? t("helpCentre.tour.continue")
            : isLastStep
              ? t("helpCentre.tour.finish")
              : t("helpCentre.tour.next")}
        </button>
      </div>
    </div>
  );
}

// Replaces Joyride's default black beacon dot with green one
function CustomBeacon() {
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        width: 20,
        height: 20,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "#1D9E75",
          opacity: 0.4,
          animation: "tour-beacon-pulse 1.4s ease-in-out infinite",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          background: "#1D9E75",
        }}
      />
    </span>
  );
}

type View = "home" | "faq";

export default function HelpCentre() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Which page-group of the tour we're currently showing
  const [routeIndex, setRouteIndex] = useState(0);
  const prevPathname = useRef(pathname);

  const bridgeNavRef = useRef(false);

  const tasksSteps: TourStep[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: t("helpCentre.tour.steps.welcome.content"),
        title: t("helpCentre.tour.steps.welcome.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-tasks",
        placement: "left",
        content: t("helpCentre.tour.steps.taskBoard.content"),
        title: t("helpCentre.tour.steps.taskBoard.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      //  bridge step: sends the user to dashboard
      {
        target: "#tour-nav-dashboard",
        placement: "bottom",
        content: t("helpCentre.tour.steps.goToDashboard.content"),
        title: t("helpCentre.tour.steps.goToDashboard.title"),
        disableBeacon: true,
        disableScrolling: true,
        data: { bridge: true, route: "/dashboard" },
      },
    ],
    [t],
  );

  const dashboardSteps: TourStep[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: t("helpCentre.tour.steps.dashboardIntro.content"),
        title: t("helpCentre.tour.steps.dashboardIntro.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-dashboard-overview",
        placement: "bottom",
        content: t("helpCentre.tour.steps.dashboardOverview.content"),
        title: t("helpCentre.tour.steps.dashboardOverview.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-habit-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.habitTracker.content"),
        title: t("helpCentre.tour.steps.habitTracker.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-goal-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.goalTracker.content"),
        title: t("helpCentre.tour.steps.goalTracker.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-navbar",
        content: t("helpCentre.tour.steps.navigationEnd.content"),
        title: t("helpCentre.tour.steps.navigationEnd.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      //  bridge step: sends the user to Journal
      {
        target: "#tour-nav-journal",
        placement: "bottom",
        content: t("helpCentre.tour.steps.goToJournal.content"),
        title: t("helpCentre.tour.steps.goToJournal.title"),
        disableBeacon: true,
        disableScrolling: true,
        data: { bridge: true, route: "/journal" },
      },
    ],
    [t],
  );

  const journalSteps: TourStep[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: t("helpCentre.tour.steps.journalIntro.content"),
        title: t("helpCentre.tour.steps.journalIntro.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-mood-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.moodTab.content"),
        title: t("helpCentre.tour.steps.moodTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-write-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.writeTab.content"),
        title: t("helpCentre.tour.steps.writeTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-history-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.historyTab.content"),
        title: t("helpCentre.tour.steps.historyTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      // sends the user to Nutrition
      {
        target: "#tour-nav-nutrition",
        placement: "bottom",
        content: t("helpCentre.tour.steps.goToNutrition.content"),
        title: t("helpCentre.tour.steps.goToNutrition.title"),
        disableBeacon: true,
        disableScrolling: true,
        data: { bridge: true, route: "/nutrition" },
      },
    ],
    [t],
  );

  const nutritionSteps: TourStep[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: t("helpCentre.tour.steps.nutritionIntro.content"),
        title: t("helpCentre.tour.steps.nutritionIntro.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-tracker-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.trackerTab.content"),
        title: t("helpCentre.tour.steps.trackerTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-insights-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.nutritionInsightsTab.content"),
        title: t("helpCentre.tour.steps.nutritionInsightsTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      // sends the user to the Insights page
      {
        target: "#tour-nav-insights",
        placement: "bottom",
        content: t("helpCentre.tour.steps.goToInsights.content"),
        title: t("helpCentre.tour.steps.goToInsights.title"),
        disableBeacon: true,
        disableScrolling: true,
        data: { bridge: true, route: "/insights" },
      },
    ],
    [t],
  );

  const insightsSteps: TourStep[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: t("helpCentre.tour.steps.insightsIntro.content"),
        title: t("helpCentre.tour.steps.insightsIntro.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-nav-social",
        placement: "bottom",
        content: t("helpCentre.tour.steps.goToSocial.content"),
        title: t("helpCentre.tour.steps.goToSocial.title"),
        disableBeacon: true,
        disableScrolling: true,
        data: { bridge: true, route: "/social" },
      },
    ],
    [t],
  );

  const socialSteps: TourStep[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: t("helpCentre.tour.steps.socialIntro.content"),
        title: t("helpCentre.tour.steps.socialIntro.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-challenges-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.challengesTab.content"),
        title: t("helpCentre.tour.steps.challengesTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-profile-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.profileTab.content"),
        title: t("helpCentre.tour.steps.profileTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-community-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.communityTab.content"),
        title: t("helpCentre.tour.steps.communityTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      // bridge step: sends the user to Settings
      {
        target: "#tour-nav-settings",
        placement: "bottom",
        content: t("helpCentre.tour.steps.goToSettings.content"),
        title: t("helpCentre.tour.steps.goToSettings.title"),
        disableBeacon: true,
        disableScrolling: true,
        data: { bridge: true, route: "/settings" },
      },
    ],
    [t],
  );

  const settingsSteps: TourStep[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: t("helpCentre.tour.steps.settingsIntro.content"),
        title: t("helpCentre.tour.steps.settingsIntro.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-mood-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.moodSettingsTab.content"),
        title: t("helpCentre.tour.steps.moodSettingsTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-notifications-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.notificationsTab.content"),
        title: t("helpCentre.tour.steps.notificationsTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-nutrition_goals-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.nutritionGoalsTab.content"),
        title: t("helpCentre.tour.steps.nutritionGoalsTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
      {
        target: "#tour-profile-tab",
        placement: "bottom",
        content: t("helpCentre.tour.steps.profileSettingsTab.content"),
        title: t("helpCentre.tour.steps.profileSettingsTab.title"),
        disableBeacon: true,
        disableScrolling: true,
      },
    ],
    [t],
  );

  const stepsByRoute: Record<string, TourStep[]> = useMemo(
    () => ({
      "/": tasksSteps,
      "/dashboard": dashboardSteps,
      "/journal": journalSteps,
      "/nutrition": nutritionSteps,
      "/insights": insightsSteps,
      "/social": socialSteps,
      "/settings": settingsSteps,
    }),
    [
      tasksSteps,
      dashboardSteps,
      journalSteps,
      nutritionSteps,
      insightsSteps,
      socialSteps,
      settingsSteps,
    ],
  );

  const activeSteps = stepsByRoute[TOUR_ROUTE_ORDER[routeIndex]] ?? [];

  const orderedGroups = useMemo(
    () => TOUR_ROUTE_ORDER.map((route) => stepsByRoute[route] ?? []),
    [stepsByRoute],
  );
  const totalSteps = useMemo(
    () => orderedGroups.reduce((sum, group) => sum + group.length, 0),
    [orderedGroups],
  );
  const stepOffset = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < routeIndex; i++)
      offset += orderedGroups[i]?.length ?? 0;
    return offset;
  }, [orderedGroups, routeIndex]);

  const TooltipWithGlobalCount = useMemo(() => {
    const Wrapped = (props: JoyrideTooltipProps) => (
      <CustomTooltip
        {...props}
        globalIndex={stepOffset + props.index}
        globalTotal={totalSteps}
        onBridgeNavigate={() => {
          bridgeNavRef.current = true;
        }}
      />
    );
    Wrapped.displayName = "TooltipWithGlobalCount";
    return Wrapped;
  }, [stepOffset, totalSteps]);

  const FAQ_ITEMS = [
    {
      q: t("helpCentre.faq.wellnessScore.q"),
      a: t("helpCentre.faq.wellnessScore.a"),
    },
    { q: t("helpCentre.faq.logMeal.q"), a: t("helpCentre.faq.logMeal.a") },
    {
      q: t("helpCentre.faq.habitStreak.q"),
      a: t("helpCentre.faq.habitStreak.a"),
    },
    {
      q: t("helpCentre.faq.editJournal.q"),
      a: t("helpCentre.faq.editJournal.a"),
    },
    {
      q: t("helpCentre.faq.exportData.q"),
      a: t("helpCentre.faq.exportData.a"),
    },
    {
      q: t("helpCentre.faq.supplementStreak.q"),
      a: t("helpCentre.faq.supplementStreak.a"),
    },
  ];

  // auto-start for first-time users
  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem(TOUR_DONE_KEY)) {
      localStorage.setItem(TOUR_DONE_KEY, "1");
      const startIdx = TOUR_ROUTE_ORDER.indexOf(pathname);
      setRouteIndex(startIdx >= 0 ? startIdx : 0);
      setRun(true);
    }
  }, []);

  // Freeze page scroll while tour overlay is active
  useEffect(() => {
    document.body.style.overflow = run ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [run]);

  // When the tour is running and the URL changes when user click, then we advance to that route's step
  // group and remount Joyride so it starts fresh at index 0 on the new page.
  useEffect(() => {
    console.log("[GuidedTour] pathname effect fired", {
      pathname,
      prevPathname: prevPathname.current,
      run,
    });

    if (pathname === prevPathname.current) {
      console.log(
        "[GuidedTour] bail: pathname unchanged from prevPathname.current",
      );
      return;
    }
    prevPathname.current = pathname;

    if (!run) {
      console.log("[GuidedTour] bail: run is false, ignoring pathname change");
      return;
    }

    if (!bridgeNavRef.current) {
      // when user dont press continue but click manually to change page, we stop the tour
      console.log(
        "[GuidedTour] bail: pathname changed without a bridge click — stopping tour",
      );
      setRun(false);
      return;
    }
    bridgeNavRef.current = false;
    const normalizedPathname =
      pathname.length > 1 && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;

    const newRouteIdx = TOUR_ROUTE_ORDER.indexOf(normalizedPathname);
    if (newRouteIdx === -1) {
      console.warn(
        "[GuidedTour] pathname after bridge navigation did not match TOUR_ROUTE_ORDER — stopping tour.",
        { pathname, normalizedPathname, TOUR_ROUTE_ORDER },
      );
      setRun(false);
      return;
    }

    const nextSteps = stepsByRoute[TOUR_ROUTE_ORDER[newRouteIdx]] ?? [];
    const firstTarget = nextSteps[0]?.target;
    console.log("[GuidedTour] route matched, checking target", {
      newRouteIdx,
      firstTarget,
    });

    let cancelled = false;
    const advance = () => {
      if (cancelled) return;
      console.log("[GuidedTour] advancing to new route steps", { newRouteIdx });
      setRouteIndex(newRouteIdx);
      setTourKey((k) => k + 1);
    };

    if (
      !firstTarget ||
      firstTarget === "body" ||
      document.querySelector(firstTarget)
    ) {
      advance();
      return;
    }

    const maxAttempts = 40; // About 2s at 50ms intervals
    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts += 1;
      if (cancelled) {
        clearInterval(intervalId);
        return;
      }
      if (document.querySelector(firstTarget)) {
        clearInterval(intervalId);
        advance();
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        console.warn(
          "[GuidedTour] gave up waiting for target element, advancing anyway",
          { firstTarget },
        );
        advance();
      }
    }, 50);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [pathname, run, stepsByRoute]);

  const handleJoyrideCallback = (data: JoyrideData) => {
    console.log("[GuidedTour] Joyride callback", data, { routeIndex });

    if (data.status === "skipped") {
      // Explicit "Skip Tutorial" click will always stop for real.
      setRun(false);
      localStorage.setItem(TOUR_DONE_KEY, "1");
      return;
    }

    if (data.status === "finished") {
      const isLastRoute = routeIndex === TOUR_ROUTE_ORDER.length - 1;
      if (isLastRoute) {
        setRun(false);
        localStorage.setItem(TOUR_DONE_KEY, "1");
      }
    }
  };

  const startTour = () => {
    setOpen(false);
    setView("home");

    // Always start the tour from its first route so it plays in order,
    // navigating there first if the user opened Help Centre elsewhere.
    const firstRoute = TOUR_ROUTE_ORDER[0];
    if (pathname !== firstRoute) {
      router.push(firstRoute);
    }
    setRouteIndex(0);
    setTourKey((prev) => prev + 1);
    bridgeNavRef.current = false;
    setRun(true);
    localStorage.setItem(TOUR_DONE_KEY, "1");
  };

  const handleClose = () => {
    setOpen(false);
    setView("home");
    setOpenFaq(null);
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .react-joyride__spotlight {
          animation: tour-spotlight-glow 1.6s ease-in-out infinite;
        }
        @keyframes tour-spotlight-glow {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(29, 158, 117, 0.9), 0 0 0 8px rgba(29, 158, 117, 0.35);
          }
          50% {
            box-shadow: 0 0 0 3px rgba(29, 158, 117, 0.6), 0 0 0 14px rgba(29, 158, 117, 0.15);
          }
        }
      `}</style>
      <Joyride
        key={tourKey}
        callback={handleJoyrideCallback}
        continuous
        run={run}
        steps={activeSteps}
        tooltipComponent={TooltipWithGlobalCount}
        beaconComponent={CustomBeacon}
        styles={{
          options: {
            overlayColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 999,
          },
        }}
      />
      <button
        onClick={() => setOpen(true)}
        className="fixed top-5 right-5 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 shadow-md transition-all"
        aria-label={t("helpCentre.ariaLabel")}
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── HOME VIEW ── */}
            {view === "home" && (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                  <h2 className="font-semibold text-base text-slate-800">
                    {t("helpCentre.title")}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="py-2 overflow-y-auto flex-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-5 pt-4 pb-1">
                    {t("helpCentre.getStarted")}
                  </p>
                  <button
                    onClick={startTour}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Rocket size={16} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">
                      {t("helpCentre.productTour")}
                    </span>
                    <span className="ml-auto text-xs text-emerald-600 font-medium">
                      {t("helpCentre.startTour")}
                    </span>
                  </button>

                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-5 pt-4 pb-1">
                    {t("helpCentre.reference")}
                  </p>
                  <button
                    onClick={() => setView("faq")}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <BookOpen size={16} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">
                      {t("helpCentre.faqLabel")}
                    </span>
                    <ChevronRight
                      size={14}
                      className="ml-auto text-slate-400"
                    />
                  </button>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 shrink-0">
                  <p className="text-xs text-slate-400 text-center">
                    {t("helpCentre.footer")}
                  </p>
                </div>
              </>
            )}

            {/*  FAQ  */}
            {view === "faq" && (
              <>
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 shrink-0">
                  <button
                    onClick={() => {
                      setView("home");
                      setOpenFaq(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={t("helpCentre.back")}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="font-semibold text-base text-slate-800">
                    {t("helpCentre.faqLabel")}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 py-2">
                  {FAQ_ITEMS.map((item, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="text-sm text-slate-700 leading-snug">
                          {item.q}
                        </span>
                        {openFaq === i ? (
                          <ChevronUp
                            size={14}
                            className="text-slate-400 shrink-0"
                          />
                        ) : (
                          <ChevronDown
                            size={14}
                            className="text-slate-400 shrink-0"
                          />
                        )}
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
                  <p className="text-xs text-slate-400 text-center">
                    {t("helpCentre.footer")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
