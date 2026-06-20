// To add a new settings section:
// 1. Add a new entry to SETTINGS_SECTIONS below
// 2. Create frontend/app/components/settings/<NewSection>.tsx
// 3. Register it in settings/page.tsx SECTION_COMPONENTS map and in OnboardingWizard.tsx WIZARD_STEP_COMPONENTS map (only if includeInWizard: true)

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  includeInWizard: boolean;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "mood",
    title: "Mood",
    description: "Choose your emoji pack and customise each mood level label and colour",
    includeInWizard: true,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Manage how and when LifeOS notifies you about tasks, habits, and goals",
    includeInWizard: false,
  },
  {
    id: "nutrition_goals",
    title: "Nutrition",
    description: "Set your body metrics to personalise your goals",
    includeInWizard: false,
  },
];

export const WIZARD_SECTIONS = SETTINGS_SECTIONS.filter((s) => s.includeInWizard);