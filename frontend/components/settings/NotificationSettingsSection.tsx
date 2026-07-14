"use client";

import { useState, useEffect } from "react";
import { useToastContext } from "../../components/notifications/ToastContext";
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
      
      showToast("Settings updated");
      // setSaved(true);
      // setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // shared toggle function
  const toggle = (field: keyof NotificationPrefs) => (checked: boolean) =>
    setPrefs({ ...prefs, [field]: checked });

  if (loading) return <p className="text-sm text-slate-400">Loading preferences…</p>;

  return (
    <div className="space-y-6">
      <SettingsSectionCard title="General">
        <SettingsRow label="Email notifications" hint="Receive email reminders from LifeOS" noBorder>
          <SettingsToggle
            checked={prefs.notifications_enabled}
            onChange={toggle("notifications_enabled")}
            label="Email notifications"
          />
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsSectionCard title="Reminders">
        <SettingsRow label="Task due reminders" hint="Get notified before a task is due">
          <SettingsToggle
            checked={prefs.task_reminders}
            onChange={toggle("task_reminders")}
            label="Task due reminders"
          />
        </SettingsRow>

        {prefs.task_reminders && (
          <SettingsRow label="Remind me" hint="How far in advance to notify you" emphasis noBorder>
            <select
              value={prefs.lead_time_mins}
              onChange={(e) => setPrefs({ ...prefs, lead_time_mins: parseInt(e.target.value) })}
              className="rounded-xl border-r-8 border-transparent bg-white pl-3 pr-4 py-1.5 text-sm text-slate-700 outline outline-1 outline-slate-300 focus:outline-2 focus:outline-indigo-400 transition cursor-pointer"
            >
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="120">2 hours before</option>
              <option value="1440">1 day before</option>
            </select>
          </SettingsRow>
        )}

        {/*Habit checkin*/}
        <SettingsRow label="Daily habit check-in" hint="Morning nudge to log your habits (8am)" noBorder>
          <SettingsToggle
            checked={prefs.habit_checkins}
            onChange={toggle("habit_checkins")}
            label="Daily habit check-in"
          />
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsSectionCard title="Quiet hours" description="No notifications will be sent during this window">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">From</label>
            <input
              type="time"
              value={prefs.quiet_start}
              onChange={(e) => setPrefs({ ...prefs, quiet_start: e.target.value })}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <span className="pt-5 text-sm text-slate-400">to</span>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Until</label>
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
        <SettingsGroupLabel>Tasks &amp; Goals</SettingsGroupLabel>
        <SettingsRow label="Overdue task alerts" hint="Notified once per task that passes its due date incomplete">
          <SettingsToggle checked={prefs.overdue_tasks} onChange={toggle("overdue_tasks")} label="Overdue task alerts" />
        </SettingsRow>
        <SettingsRow label="Goal deadline warnings" hint="Alerts at 7, 3, and 1 day before a goal is due" noBorder>
          <SettingsToggle checked={prefs.goal_deadlines} onChange={toggle("goal_deadlines")} label="Goal deadline warnings" />
        </SettingsRow>

        <SettingsGroupLabel>Habits</SettingsGroupLabel>
        <SettingsRow label="Streak at risk" hint="9pm reminder if you haven't logged a habit with an active streak">
          <SettingsToggle checked={prefs.streak_risk} onChange={toggle("streak_risk")} label="Streak at risk" />
        </SettingsRow>
        <SettingsRow label="Streak milestones" hint="Celebrate hitting 7, 14, 30, 60, and 100-day streaks" noBorder>
          <SettingsToggle checked={prefs.streak_milestone} onChange={toggle("streak_milestone")} label="Streak milestones" />
        </SettingsRow>

        <SettingsGroupLabel>Journal</SettingsGroupLabel>
        <SettingsRow label="Daily journal nudge" hint="8pm reminder on days you haven't written an entry" noBorder>
          <SettingsToggle checked={prefs.journal_nudge} onChange={toggle("journal_nudge")} label="Daily journal nudge" />
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsActionFooter onSave={handleSave} saving={saving} label="Save preferences" />
    </div>
  );
}