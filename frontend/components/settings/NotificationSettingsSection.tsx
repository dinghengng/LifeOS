"use client";

import { useState, useEffect } from "react";
import { useToastContext } from "../../components/notifications/ToastContext";
import { useTranslation } from "../../context/LanguageContext";
import SettingsSectionCard from "./SettingsSectionCard";
import SettingsRow from "./SettingsRow";
import SettingsToggle from "./SettingsToggle";
import SettingsGroupLabel from "./SettingsGroupLabel";
import SettingsActionFooter from "./SettingsActionFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

//toggles
interface NotificationPrefs {
  task_reminders:   boolean;
  habit_checkins:   boolean;
  lead_time_mins:   number;
  quiet_start:      string;
  quiet_end:        string;
  overdue_tasks:    boolean;
  goal_deadlines:   boolean;
  streak_risk:      boolean;
  streak_milestone: boolean;
  journal_nudge:    boolean;
  notifications_enabled: boolean;
}

//default toggle values
const DEFAULT_PREFS: NotificationPrefs = {
  task_reminders:   true,
  habit_checkins:   true,
  lead_time_mins:   30,
  quiet_start:      "22:00",
  quiet_end:        "08:00",
  overdue_tasks:    true,
  goal_deadlines:   true,
  streak_risk:      true,
  streak_milestone: true,
  journal_nudge:    true,
  notifications_enabled: true,
};

export default function NotificationSettingsSection() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [saved, setSaved] = useState(false);
  const { showToast } = useToastContext();

  useEffect(() => {
    fetch(`${API_BASE}/api/notifications/preferences`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.task_reminders !== undefined) setPrefs({ ...DEFAULT_PREFS, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // setSaved(false);
    try {
      await fetch(`${API_BASE}/api/notifications/preferences`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      //reregister push token
      if (prefs.notifications_enabled) {
        const { registerWebPush } = await import('../../app/hooks/useNotifications');
        await registerWebPush();
      }
      
      showToast(t("notificationSettings.toastUpdated"));
      // setSaved(true);
      // setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      showToast(t("notificationSettings.toastSaveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  // shared toggle function
  const toggle = (field: keyof NotificationPrefs) => (checked: boolean) =>
    setPrefs({ ...prefs, [field]: checked });

  if (loading) return <p className="text-sm text-slate-400">{t("notificationSettings.loading")}</p>;

  return (
    <div className="space-y-6">
      <SettingsSectionCard title={t("notificationSettings.general.title")}>
        <SettingsRow
          label={t("notificationSettings.general.emailLabel")}
          hint={t("notificationSettings.general.emailHint")}
          noBorder
        >
          <SettingsToggle
            checked={prefs.notifications_enabled}
            onChange={toggle("notifications_enabled")}
            label={t("notificationSettings.general.emailLabel")}
          />
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsSectionCard title={t("notificationSettings.reminders.title")}>
        <SettingsRow
          label={t("notificationSettings.reminders.taskDueLabel")}
          hint={t("notificationSettings.reminders.taskDueHint")}
        >
          <SettingsToggle
            checked={prefs.task_reminders}
            onChange={toggle("task_reminders")}
            label={t("notificationSettings.reminders.taskDueLabel")}
          />
        </SettingsRow>

        {prefs.task_reminders && (
          <SettingsRow
            label={t("notificationSettings.reminders.remindMeLabel")}
            hint={t("notificationSettings.reminders.remindMeHint")}
            emphasis
            noBorder
          >
            <select
              value={prefs.lead_time_mins}
              onChange={(e) => setPrefs({ ...prefs, lead_time_mins: parseInt(e.target.value) })}
              className="rounded-xl border-r-8 border-transparent bg-white pl-3 pr-4 py-1.5 text-sm text-slate-700 outline outline-1 outline-slate-300 focus:outline-2 focus:outline-indigo-400 transition cursor-pointer"
            >
              <option value="5">{t("notificationSettings.reminders.leadTime.min5")}</option>
              <option value="15">{t("notificationSettings.reminders.leadTime.min15")}</option>
              <option value="30">{t("notificationSettings.reminders.leadTime.min30")}</option>
              <option value="60">{t("notificationSettings.reminders.leadTime.hour1")}</option>
              <option value="120">{t("notificationSettings.reminders.leadTime.hour2")}</option>
              <option value="1440">{t("notificationSettings.reminders.leadTime.day1")}</option>
            </select>
          </SettingsRow>
        )}

        {/*Habit checkin*/}
        <SettingsRow
          label={t("notificationSettings.reminders.habitCheckinLabel")}
          hint={t("notificationSettings.reminders.habitCheckinHint")}
          noBorder
        >
          <SettingsToggle
            checked={prefs.habit_checkins}
            onChange={toggle("habit_checkins")}
            label={t("notificationSettings.reminders.habitCheckinLabel")}
          />
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsSectionCard
        title={t("notificationSettings.quietHours.title")}
        description={t("notificationSettings.quietHours.description")}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("notificationSettings.quietHours.from")}
            </label>
            <input
              type="time"
              value={prefs.quiet_start}
              onChange={(e) => setPrefs({ ...prefs, quiet_start: e.target.value })}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <span className="pt-5 text-sm text-slate-400">{t("notificationSettings.quietHours.to")}</span>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("notificationSettings.quietHours.until")}
            </label>
            <input
              type="time"
              value={prefs.quiet_end}
              onChange={(e) => setPrefs({ ...prefs, quiet_end: e.target.value })}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
        </div>
      </SettingsSectionCard>

      {/*notification toggles*/}
      <SettingsSectionCard>
        <SettingsGroupLabel>{t("notificationSettings.groups.tasksAndGoals")}</SettingsGroupLabel>
        <SettingsRow
          label={t("notificationSettings.toggles.overdueTasks.label")}
          hint={t("notificationSettings.toggles.overdueTasks.hint")}
        >
          <SettingsToggle
            checked={prefs.overdue_tasks}
            onChange={toggle("overdue_tasks")}
            label={t("notificationSettings.toggles.overdueTasks.label")}
          />
        </SettingsRow>
        <SettingsRow
          label={t("notificationSettings.toggles.goalDeadlines.label")}
          hint={t("notificationSettings.toggles.goalDeadlines.hint")}
          noBorder
        >
          <SettingsToggle
            checked={prefs.goal_deadlines}
            onChange={toggle("goal_deadlines")}
            label={t("notificationSettings.toggles.goalDeadlines.label")}
          />
        </SettingsRow>

        <SettingsGroupLabel>{t("notificationSettings.groups.habits")}</SettingsGroupLabel>
        <SettingsRow
          label={t("notificationSettings.toggles.streakRisk.label")}
          hint={t("notificationSettings.toggles.streakRisk.hint")}
        >
          <SettingsToggle
            checked={prefs.streak_risk}
            onChange={toggle("streak_risk")}
            label={t("notificationSettings.toggles.streakRisk.label")}
          />
        </SettingsRow>
        <SettingsRow
          label={t("notificationSettings.toggles.streakMilestone.label")}
          hint={t("notificationSettings.toggles.streakMilestone.hint")}
          noBorder
        >
          <SettingsToggle
            checked={prefs.streak_milestone}
            onChange={toggle("streak_milestone")}
            label={t("notificationSettings.toggles.streakMilestone.label")}
          />
        </SettingsRow>

        <SettingsGroupLabel>{t("notificationSettings.groups.journal")}</SettingsGroupLabel>
        <SettingsRow
          label={t("notificationSettings.toggles.journalNudge.label")}
          hint={t("notificationSettings.toggles.journalNudge.hint")}
          noBorder
        >
          <SettingsToggle
            checked={prefs.journal_nudge}
            onChange={toggle("journal_nudge")}
            label={t("notificationSettings.toggles.journalNudge.label")}
          />
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsActionFooter onSave={handleSave} saving={saving} label={t("notificationSettings.savePreferences")} />
    </div>
  );
}