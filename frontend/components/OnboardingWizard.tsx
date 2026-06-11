"use client";

import { useState, useRef } from "react";
import { WIZARD_SECTIONS } from "../../shared/settingsSection";
import { MoodLevelConfig } from "../../shared/types";
import MoodSettingsSection from "./settings/MoodSettingsSection";

const WIZARD_STEP_COMPONENTS: Record<
  string,
  React.ComponentType<{
    onSaved?: (saved: MoodLevelConfig[]) => void;
    hideSaveButton?: boolean;
    saveRef?: React.RefObject<(() => Promise<MoodLevelConfig[] | null>) | null>;
  }>
> = {
  mood: MoodSettingsSection,
};

type WizardStep = "welcome" | string | "complete";

interface Props {
  userName: string | null;
  onComplete: () => void;
}

export default function OnboardingWizard({ userName, onComplete }: Props) {
  const wizardSteps: WizardStep[] = [
    "welcome",
    ...WIZARD_SECTIONS.map((s) => s.id),
    "complete",
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionSaveRef = useRef<(() => Promise<MoodLevelConfig[] | null>) | null>(null);

  const currentStep = wizardSteps[stepIndex];
  const totalSectionSteps = WIZARD_SECTIONS.length;
  const currentSectionIndex = WIZARD_SECTIONS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStep === "welcome";
  const isLastStep = currentStep === "complete";

  const progressPercent =
    currentSectionIndex === -1
      ? currentStep === "complete" ? 100 : 0
      : Math.round(((currentSectionIndex + 1) / totalSectionSteps) * 100);

  const handleNext = async () => {
    setError(null);
    if (currentSectionIndex !== -1 && sectionSaveRef.current) {
      setAdvancing(true);
      const result = await sectionSaveRef.current();
      setAdvancing(false);
      if (!result) {
        setError("Could not save. Please try again.");
        return;
      }
    }
    if (isLastStep) {
      onComplete();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {!isFirstStep && !isLastStep && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-1 bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="p-8 overflow-y-auto flex-1">
          {/*Welcome page*/}
          {currentStep === "welcome" && (
            <div className="text-center space-y-4 py-4">
              <h1 className="text-2xl font-semibold text-slate-800">
                Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                LifeOS helps you track your mood, journal your days, and build
                better habits. Let&apos;s take a minute to set things up.
              </p>
              <p className="text-xs text-slate-400">This takes about 1 minute</p>
            </div>
          )}

          {currentSectionIndex !== -1 && (() => {
            const section = WIZARD_SECTIONS[currentSectionIndex];
            const SectionComponent = WIZARD_STEP_COMPONENTS[section.id];
            if (!SectionComponent) return null;
            return (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">
                    Step {currentSectionIndex + 1} of {totalSectionSteps}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-800">{section.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                </div>
                <SectionComponent
                  hideSaveButton
                  saveRef={sectionSaveRef}
                  onSaved={() => {}}
                />
              </div>
            );
          })()}

          {currentStep === "complete" && (
            <div className="text-center space-y-4 py-4">
              <h2 className="text-2xl font-semibold text-slate-800">You&apos;re all set!</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Your mood levels are configured. You can change them anytime from Settings.
              </p>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={advancing}
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {advancing ? "Saving…" : isLastStep ? "Start using LifeOS" : isFirstStep ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}