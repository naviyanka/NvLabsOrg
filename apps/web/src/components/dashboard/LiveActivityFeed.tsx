"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/office-store";

export default function LiveActivityFeed() {
  const notifications = useOfficeStore((s) => s.notifications);

  const activities = useMemo(() => {
    const recent = [...notifications].reverse().slice(0, 8);
    return recent.map((n) => {
      const time = new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
      let icon = "◆";
      let color = "var(--v2-blue)";
      if (n.type === "task_done") { icon = "✓"; color = "var(--v2-green)"; }
      else if (n.type === "task_failed") { icon = "✕"; color = "var(--v2-red)"; }
      else if (n.type === "approval_needed") { icon = "⏸"; color = "var(--v2-yellow)"; }
      else if (n.type === "agent_created") { icon = "+"; color = "var(--v2-cyan)"; }
      return { time, icon, color, text: n.title ?? "Event", detail: n.body ?? "" };
    });
  }, [notifications]);

  // Fallback if no notifications yet
  const displayActivities = activities.length > 0 ? activities : [
    { time: "—", icon: "◆", color: "var(--v2-text-dim)", text: "Waiting for activity...", detail: "Connect agents to see live updates" },
  ];

  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div>
          <div className="v2-section-title">Live Activity</div>
          <div className="v2-section-subtitle">All Systems Live</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {displayActivities.map((activity, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
            borderBottom: i < displayActivities.length - 1 ? "1px solid var(--v2-card-border)" : "none",
          }}>
            <span style={{ fontSize: 10, color: "var(--v2-text-dim)", whiteSpace: "nowrap", paddingTop: 2, minWidth: 56 }}>
              {activity.time}
            </span>
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: `${activity.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, flexShrink: 0, color: activity.color,
            }}>{activity.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--v2-text)", lineHeight: 1.4 }}>
                {activity.text}
              </div>
              {activity.detail && activity.detail !== activity.text && (
                <div style={{ fontSize: 10, color: "var(--v2-text-muted)", marginTop: 1 }}>{activity.detail.slice(0, 60)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <span className="v2-section-link">View All Activity →</span>
      </div>
    </div>
  );
}
