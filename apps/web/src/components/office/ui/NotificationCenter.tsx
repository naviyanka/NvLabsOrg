"use client";

import { useState, useRef, useEffect } from "react";
import { useOfficeStore, type AppNotification } from "@/store/office-store";

/** Bell icon with unread badge — click to open drawer */
export function NotificationBell({ onClick }: { onClick: () => void }) {
  const unread = useOfficeStore((s) => s.unreadNotifications);

  return (
    <button
      onClick={onClick}
      className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      title="Notifications"
      style={{ fontFamily: "system-ui", fontSize: 16, lineHeight: 1 }}
    >
      🔔
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-bold leading-none"
          style={{ background: "#ef4444", color: "#fff", padding: "0 4px" }}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

/** Slide-out notification drawer */
export function NotificationDrawer({ isOpen, onClose, onSelectAgent }: {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent?: (agentId: string) => void;
}) {
  const notifications = useOfficeStore((s) => s.notifications);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mark all as read when drawer opens
  useEffect(() => {
    if (isOpen && notifications.some(n => !n.read)) {
      useOfficeStore.setState((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadNotifications: 0,
      }));
    }
  }, [isOpen, notifications]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sorted = [...notifications].reverse();

  return (
    <div
      ref={drawerRef}
      className="fixed top-12 right-4 w-[320px] max-h-[420px] overflow-hidden rounded-lg border border-[rgba(255,255,255,0.1)] shadow-2xl z-[200] flex flex-col"
      style={{ background: "var(--background, #0a0a0b)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-[12px] font-medium text-foreground">Notifications</span>
        {notifications.length > 0 && (
          <button
            onClick={() => useOfficeStore.setState({ notifications: [], unreadNotifications: 0 })}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: 370 }}>
        {sorted.length === 0 ? (
          <div className="text-center text-[11px] text-muted-foreground py-10 opacity-60">
            No notifications yet
          </div>
        ) : (
          sorted.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={() => {
                if (n.agentId && onSelectAgent) {
                  onSelectAgent(n.agentId);
                  onClose();
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification: n, onClick }: { notification: AppNotification; onClick: () => void }) {
  const icon = n.type === "task_done" ? "✅"
    : n.type === "task_failed" ? "❌"
    : n.type === "approval_needed" ? "🔐"
    : "➕";

  const timeAgo = formatTimeAgo(n.timestamp);

  return (
    <div
      onClick={onClick}
      className="px-3 py-2 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.03] cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-2">
        <span className="text-[13px] shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-foreground font-medium truncate">{n.title}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>
          <div className="text-[9px] text-muted-foreground mt-1 opacity-60">{timeAgo}</div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}
