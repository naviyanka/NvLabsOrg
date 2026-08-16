"use client";

import { useOfficeStore } from "@/store/office-store";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface LeftSidebarProps {
  viewMode: "scene" | "dashboard" | "files" | "git";
  onSetViewMode: (mode: "scene" | "dashboard" | "files" | "git") => void;
  onNotificationClick: () => void;
  showShareMenu: boolean;
  onToggleShareMenu: () => void;
  onCreateShareLink: (role: "collaborator" | "spectator") => void;
  isOwner: boolean;
  connected: boolean;
}

const VIEW_MODES: Array<{ key: "scene" | "dashboard" | "files" | "git"; icon: string; label: string }> = [
  { key: "scene", icon: "🏢", label: "Scene" },
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "files", icon: "📁", label: "Files" },
  { key: "git", icon: "🔀", label: "Git" },
];

function Divider() {
  return (
    <div
      style={{
        width: 24,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        margin: "4px 0",
      }}
    />
  );
}

/** Inline notification bell to avoid importing from NotificationCenter (prevents chunk collision) */
function SidebarBell({ onClick }: { onClick: () => void }) {
  const unread = useOfficeStore((s) => s.unreadNotifications);
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        backgroundColor: "transparent",
        cursor: "pointer",
        fontSize: 15,
        lineHeight: 1,
        color: "var(--term-text, #94a3b8)",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
      }}
    >
      🔔
      {unread > 0 && (
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            minWidth: 14,
            height: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 9999,
            fontSize: 8,
            fontWeight: 700,
            lineHeight: 1,
            background: "#ef4444",
            color: "#fff",
            padding: "0 3px",
          }}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

export default function LeftSidebar({
  viewMode,
  onSetViewMode,
  onNotificationClick,
  showShareMenu,
  onToggleShareMenu,
  onCreateShareLink,
  isOwner,
  connected,
}: LeftSidebarProps) {
  return (
    <div
      className="left-sidebar"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 16,
        gap: 0,
        zIndex: 100,
        backgroundColor: "var(--term-panel, #111113)",
        borderRight: "1px solid var(--term-border-dim, #1c1c1f)",
        boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* ─── Connection indicator ─── */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: 8,
              backgroundColor: "transparent",
              cursor: "default",
              padding: 0,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: connected ? "#22c55e" : "#ef4444",
                boxShadow: connected
                  ? "0 0 6px rgba(34,197,94,0.5)"
                  : "0 0 6px rgba(239,68,68,0.5)",
              }}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{connected ? "Online" : "Offline"}</TooltipContent>
      </Tooltip>

      <Divider />

      {/* ─── View mode buttons (one per mode) ─── */}
      {VIEW_MODES.map((mode) => {
        const isActive = viewMode === mode.key;
        return (
          <Tooltip key={mode.key}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSetViewMode(mode.key)}
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isActive ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  backgroundColor: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                  cursor: "pointer",
                  fontSize: 15,
                  transition: "all 0.15s ease",
                  marginBottom: 4,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                {mode.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{mode.label}</TooltipContent>
          </Tooltip>
        );
      })}

      <Divider />

      {/* ─── Notification bell ─── */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <SidebarBell onClick={onNotificationClick} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">Notifications</TooltipContent>
      </Tooltip>

      <Divider />

      {/* ─── Share button (owner only) ─── */}
      {isOwner && (
        <>
          <div style={{ position: "relative" }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleShareMenu}
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #a855f760",
                    borderRadius: 8,
                    backgroundColor: showShareMenu ? "#a855f720" : "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "#c084fc",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#a855f720";
                  }}
                  onMouseLeave={(e) => {
                    if (!showShareMenu) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  🔗
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Share</TooltipContent>
            </Tooltip>

            {/* Share dropdown — flies out to the right */}
            {showShareMenu && (
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: 0,
                  marginLeft: 8,
                  zIndex: 50,
                  backgroundColor: "var(--term-panel, #111113)",
                  border: "1px solid var(--term-border, #27272a)",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 160,
                  boxShadow: "4px 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <button
                  onClick={() => onCreateShareLink("collaborator")}
                  style={{
                    padding: "8px 12px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#c084fc",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "monospace",
                    borderRadius: "6px 6px 0 0",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#a855f720";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Collaborator link
                </button>
                <button
                  onClick={() => onCreateShareLink("spectator")}
                  style={{
                    padding: "8px 12px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#7ab8f5",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "monospace",
                    borderRadius: "0 0 6px 6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#3b82f620";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Spectator link
                </button>
              </div>
            )}
          </div>

          <Divider />
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
