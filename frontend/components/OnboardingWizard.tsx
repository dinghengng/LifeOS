"use client";

import { useRef } from "react";
import { WIZARD_SECTIONS } from "../../shared/settingsSection";
import { MoodLevelConfig } from "../../shared/types";
import MoodSettingsSection from "./settings/MoodSettingsSection";
import { useTranslation } from "../context/LanguageContext";
import type { TranslationKey } from "../context/translations";

const WIZARD_STEP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  mood: MoodSettingsSection,
};

interface Props {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: Props) {
  const { t } = useTranslation();
  const section = WIZARD_SECTIONS[0];
  const SectionComponent = WIZARD_STEP_COMPONENTS[section.id];
  const sectionSaveRef = useRef<(() => Promise<MoodLevelConfig[] | null>) | null>(null);

  if (!SectionComponent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 overflow-y-auto flex-1">
          <h2 className="text-xl font-semibold text-slate-800">{t(section.titleKey as TranslationKey)}</h2>
          <p className="text-sm text-slate-500 mt-1">{t(section.descriptionKey as TranslationKey)}</p>
          <div className="mt-5">
            <SectionComponent saveRef={sectionSaveRef} onSaved={onComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}