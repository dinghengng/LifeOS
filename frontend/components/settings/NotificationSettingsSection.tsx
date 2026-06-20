"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface NotificationPrefs {
  task_reminders: boolean;
  habit_checkins: boolean;
  lead_time_mins: number;
  quiet_start: string;
  quiet_end: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  task_reminders: true,
  habit_checkins: true,
  lead_time_mins: 30,
  quiet_start: "22:00",
  quiet_end: "08:00",
};

export default function NotificationSettingsSection() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
    try {
      await fetch(`${API_BASE}/api/notifications/preferences`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: "#94a3b8", fontSize: 14 }}>Loading preferences…</div>;

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid #f1f5f9",
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Task due reminders</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Get notified before a task is due</div>
        </div>
        <input
          type="checkbox"
          checked={prefs.task_reminders}
          onChange={(e) => setPrefs({ ...prefs, task_reminders: e.target.checked })}
          style={{ width: 18, height: 18, accentColor: "#4f46e5", cursor: "pointer" }}
        />
      </div>

      {prefs.task_reminders && (
        <div style={{ ...rowStyle, paddingLeft: 16, backgroundColor: "#fafaf9", borderRadius: 8, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#475569" }}>Remind me</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>How far in advance to notify you</div>
          </div>
          <select
            value={prefs.lead_time_mins}
            onChange={(e) => setPrefs({ ...prefs, lead_time_mins: parseInt(e.target.value) })}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, color: "#1e293b", cursor: "pointer" }}
          >
            <option value={5}>5 minutes before</option>
            <option value={15}>15 minutes before</option>
            <option value={30}>30 minutes before</option>
            <option value={60}>1 hour before</option>
            <option value={120}>2 hours before</option>
            <option value={1440}>1 day before</option>
          </select>
        </div>
      )}

      {/*Habit checkin*/}
      <div style={rowStyle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Daily habit check-in</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Morning nudge to log your habits (8am)</div>
        </div>
        <input
          type="checkbox"
          checked={prefs.habit_checkins}
          onChange={(e) => setPrefs({ ...prefs, habit_checkins: e.target.checked })}
          style={{ width: 18, height: 18, accentColor: "#4f46e5", cursor: "pointer" }}
        />
      </div>

      <div style={{ ...rowStyle, flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Silent hours</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>No notifications will be sent during this window</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>From</label>
            <input
              type="time"
              value={prefs.quiet_start}
              onChange={(e) => setPrefs({ ...prefs, quiet_start: e.target.value })}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, color: "#1e293b" }}
            />
          </div>
          <div style={{ paddingTop: 18, color: "#94a3b8", fontSize: 13 }}>to</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Until</label>
            <input
              type="time"
              value={prefs.quiet_end}
              onChange={(e) => setPrefs({ ...prefs, quiet_end: e.target.value })}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, color: "#1e293b" }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#4f46e5",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </div>
  );
}