"use client";

import { useOfficeStore } from "@/store/office-store";
import type { NavSection } from "@/app/v2/page";
import { LayoutDashboard, Building2, Users, Bot, ClipboardList, Zap, Brain, GitBranch, BookOpen, Activity, Bell, Settings } from "lucide-react";

interface DashboardSidebarProps {
  activeNav: NavSection;
  onNavigate: (section: NavSection) => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string; Icon: any; badge?: number }> = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "office", label: "Office", Icon: Building2 },
  { id: "hr-room", label: "HR Room", Icon: Users },
  { id: "agents", label: "Agents", Icon: Bot },
  { id: "tasks", label: "Tasks", Icon: ClipboardList },
  { id: "pipelines", label: "Pipelines", Icon: Zap },
  { id: "memory", label: "Memory", Icon: Brain },
  { id: "git", label: "Git Repos", Icon: GitBranch },
  { id: "knowledge", label: "Knowledge Base", Icon: BookOpen },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "settings", label: "Settings", Icon: Settings },
];

export default function DashboardSidebar({ activeNav, onNavigate }: DashboardSidebarProps) {
  const connected = useOfficeStore((s) => s.connected);
  const unread = useOfficeStore((s) => s.unreadNotifications);

  const navItems = NAV_ITEMS.map(item =>
    item.id === "notifications" ? { ...item, badge: unread || undefined } : item
  );

  return (
    <aside className="v2-sidebar">
      {/* Logo */}
      <div style={{ padding: "20px 16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, var(--v2-accent), var(--v2-purple))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff",
        }}>N</div>
        <div className="v2-nav-label">
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>NVLABS</div>
          <div style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>Mission Control</div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0 0 16px" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`v2-nav-item ${activeNav === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.Icon size={16} style={{ flexShrink: 0 }} />
            <span className="v2-nav-label" style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span className="v2-badge" style={{ background: "var(--v2-red)", color: "#fff", fontSize: 9 }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* System Status */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--v2-card-border)" }}>
        <div className="v2-sidebar-section-title" style={{ fontSize: 10, color: "var(--v2-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          System Status
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <StatusRow label="Gateway" status={connected ? "online" : "offline"} />
          <StatusRow label="WebSocket" status={connected ? "connected" : "disconnected"} />
          <StatusRow label="Database" status="healthy" />
          <StatusRow label="Memory Store" status="healthy" />
        </div>
      </div>

      {/* User */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--v2-card-border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 600, color: "#fff",
        }}>NY</div>
        <div className="v2-user-info">
          <div style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>Navi Yanka</div>
          <div style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>Administrator</div>
        </div>
      </div>
    </aside>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const isGood = status === "online" || status === "connected" || status === "healthy";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
      <span style={{ color: "var(--v2-text-muted)" }}>{label}</span>
      <span style={{ color: isGood ? "var(--v2-green)" : "var(--v2-red)", fontWeight: 500, fontSize: 10 }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}
