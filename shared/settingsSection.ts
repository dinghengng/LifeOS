// To add a new settings section:
// 1. Add a new entry to SETTINGS_SECTIONS below
// 2. Create frontend/app/components/settings/<NewSection>.tsx
// 3. Register it in settings/page.tsx SECTION_COMPONENTS map and in OnboardingWizard.tsx WIZARD_STEP_COMPONENTS map (only if includeInWizard: true)

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  includeInWizard: boolean;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "mood",
    title: "Mood Setup",
    description: "Choose your emoji pack and customise each mood level label and colour",
    icon: "😊",
    includeInWizard: true,
  },
];

export const WIZARD_SECTIONS = SETTINGS_SECTIONS.filter((s) => s.includeInWizard);