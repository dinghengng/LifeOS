"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "../../context/LanguageContext";
import { TranslationKey } from "../../context/translations";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface NotificationItem {
  id: number;
  type: string;
  params: Record<string, string | number>;
  sent_at: string;
  read_at: string | null;
  status: string;
}

function timeAgo(dateStr: string, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notificationBell.justNow");
  if (mins < 60) return t("notificationBell.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("notificationBell.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  return t("notificationBell.daysAgo", { count: days });
}

function typeIcon(type: string): string {
  if (type === "task_reminder" || type === "task_due") return "!";
  if (type === "habit_checkin" || type === "habit_miss") return "·";
  if (type === "goal_reminder" || type === "goal_nudge") return "→";
  if (type === "habit_milestone") return "★";
  if (type === "journal_nudge") return "✎";
  return "·";
}

function renderNotification(
  n: NotificationItem,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): { title: string; body: string } {
  const p = n.params ?? {};

  switch (n.type) {
    case "task_reminder":
      return {
        title: t("notification.taskReminder.title"),
        body: t("notification.taskReminder.body", { taskTitle: String(p.taskTitle ?? "") }),
      };
    case "task_due":
      return {
        title: t("notification.taskOverdue.title"),
        body: t("notification.taskOverdue.body", { taskTitle: String(p.taskTitle ?? "") }),
      };
    case "habit_checkin":
      return {
        title: t("notification.habitCheckin.title"),
        body: t("notification.habitCheckin.body"),
      };
    case "habit_miss":
      return {
        title: t("notification.habitStreakRisk.title"),
        body: t("notification.habitStreakRisk.body", {
          habitName: String(p.habitName ?? ""),
          streak: Number(p.streak ?? 0),
        }),
      };
    case "habit_milestone":
      return {
        title: t("notification.habitMilestone.title", { streak: Number(p.streak ?? 0) }),
        body: t("notification.habitMilestone.body", {
          habitName: String(p.habitName ?? ""),
          streak: Number(p.streak ?? 0),
        }),
      };
    case "goal_nudge": {
      const daysLeft = Number(p.daysLeft ?? 0);
      const dayLabel =
        daysLeft === 1
          ? t("notification.goalDeadline.dayLabelTomorrow")
          : t("notification.goalDeadline.dayLabelInDays", { days: daysLeft });
      return {
        title: t("notification.goalDeadline.title"),
        body: t("notification.goalDeadline.body", { goalTitle: String(p.goalTitle ?? ""), dayLabel }),
      };
    }
    case "journal_nudge":
      return {
        title: t("notification.journalNudge.title"),
        body: t("notification.journalNudge.body"),
      };
    default:
      return { title: n.type, body: "" };
  }
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/inbox?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
    // change the polling interval here for testing
    const interval = setInterval(fetchInbox, 60000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  // Close panel
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/inbox/read-all`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const markOneRead = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/notifications/inbox/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  return (
    <div ref={panelRef} style={{ position: "relative", flexShrink: 0 }}>
      {/*Noti bell*/}
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchInbox();
        }}
        style={{
          position: "relative",
          width: 34,
          height: 34,
          borderRadius: "8px",
          border: "1px solid var(--color-border-secondary)",
          backgroundColor: open ? "#4f46e5" : "rgba(255,255,255,0.7)",
          color: open ? "#ffffff" : "#64748b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
        title={t("notificationBell.title")}
        aria-label={unreadCount > 0 ? t("notificationBell.ariaLabelUnread", { count: unreadCount }) : t("notificationBell.title")}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: "999px",
              backgroundColor: "#ef4444",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              border: "2px solid white",
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/*Panel*/}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 480,
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
              {t("notificationBell.title")}
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#4f46e5",
                    backgroundColor: "#ede9fe",
                    padding: "2px 7px",
                    borderRadius: "999px",
                  }}
                >
                  {t("notificationBell.newBadge", { count: unreadCount })}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: "12px",
                  color: "#4f46e5",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {t("notificationBell.markAllRead")}
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                {t("notificationBell.loading")}
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 24px",
                  gap: 10,
                  color: "#94a3b8",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
                  {t("notificationBell.emptyTitle")}
                </span>
                <span style={{ fontSize: "13px", textAlign: "center" }}>
                  {t("notificationBell.emptyBody")}
                </span>
              </div>
            ) : (
              notifications.map((n) => {
                const { title, body } = renderNotification(n, t);
                return (
                <div
                  key={n.id}
                  onClick={() => !n.read_at && markOneRead(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: "1px solid #f8fafc",
                    backgroundColor: n.read_at ? "transparent" : "#fafaf9",
                    cursor: n.read_at ? "default" : "pointer",
                    transition: "background 0.1s ease",
                  }}
                >
                  <div style={{ paddingTop: 4, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: n.read_at ? "transparent" : "#4f46e5",
                      }}
                    />
                  </div>

                  <span style={{fontSize: "13px", fontWeight: 700, color: "#64748b", flexShrink: 0, width: 16, textAlign: "center", lineHeight: 1.4,}}>
                    {typeIcon(n.type)}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: n.read_at ? 500 : 700,
                        color: "#1e293b",
                        marginBottom: 2,
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {body}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 4 }}>
                      {timeAgo(n.sent_at, t)}
                      {n.status === "failed" && (
                        <span style={{ marginLeft: 6, color: "#f59e0b", fontSize: "10px", fontWeight: 600 }}>
                          {t("notificationBell.pushFailed")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                {t("notificationBell.showingCount", { count: notifications.length })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}