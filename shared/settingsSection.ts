// To add a new settings section:
// 1. Add a new entry to SETTINGS_SECTIONS below
// 2. Create frontend/app/components/settings/<NewSection>.tsx
// 3. Register it in settings/page.tsx SECTION_COMPONENTS map and in OnboardingWizard.tsx WIZARD_STEP_COMPONENTS map (only if includeInWizard: true)

export interface SettingsSection {
  id: string;
  titleKey: string;
  descriptionKey: string;
  includeInWizard: boolean;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "mood",
    titleKey: "settingsSection.mood.title",
    descriptionKey: "settingsSection.mood.description",
    includeInWizard: true,
  },
  {
    id: "notifications",
    titleKey: "settingsSection.notifications.title",
    descriptionKey: "settingsSection.notifications.description",
    includeInWizard: false,
  },
  {
    id: "nutrition_goals",
    titleKey: "nutritionGoals.title",
    descriptionKey: "nutritionGoals.description",
    includeInWizard: false,
  },
  {
    id: "profile",
    titleKey: "settingsSection.profile.title",
    descriptionKey: "settingsSection.profile.description",
    includeInWizard: true,
  },
];

export const WIZARD_SECTIONS = SETTINGS_SECTIONS.filter((s) => s.includeInWizard);