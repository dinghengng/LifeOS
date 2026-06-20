"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  sent_at: string;
  read_at: string | null;
  status: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function typeIcon(type: string): string {
  if (type === "task_reminder") return "📋";
  if (type === "habit_checkin") return "✅";
  if (type === "goal_reminder") return "🎯";
  if (type === "streak_alert") return "🔥";
  return "🔔";
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/inbox`, {
        credentials: "include",
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
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
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
              Notifications
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
                  {unreadCount} new
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
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                Loading…
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
                  You&apos;re all caught up!
                </span>
                <span style={{ fontSize: "13px", textAlign: "center" }}>
                  Notifications will appear here when your tasks or habits need attention.
                </span>
              </div>
            ) : (
              notifications.map((n) => (
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

                  <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1.2 }}>
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
                      {n.title}
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
                      {n.body}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 4 }}>
                      {timeAgo(n.sent_at)}
                      {n.status === "failed" && (
                        <span style={{ marginLeft: 6, color: "#f59e0b", fontSize: "10px", fontWeight: 600 }}>
                          (push failed)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Showing last {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}