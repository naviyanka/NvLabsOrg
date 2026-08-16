"use client";

export default function LiveActivityFeed() {
  const activities = [
    { time: "10:24 AM", icon: "✓", color: "#22c55e", text: "Agent Alpha completed task", detail: "Subdomain Enumeration" },
    { time: "10:23 AM", icon: "⚡", color: "#a855f7", text: "Pipeline Bug Bounty Recon", detail: "progressed to 85%" },
    { time: "10:22 AM", icon: "🧠", color: "#3b82f6", text: "Agent Nova memory updated", detail: "(2.4 MB)" },
    { time: "10:21 AM", icon: "🔀", color: "#06b6d4", text: "Code pushed to", detail: "nvlabsorg/core" },
    { time: "10:20 AM", icon: "📋", color: "#eab308", text: "New task assigned to Agent", detail: "Cipher" },
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
        {activities.map((activity, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
            borderBottom: i < activities.length - 1 ? "1px solid var(--v2-card-border)" : "none",
          }}>
            <span style={{ fontSize: 10, color: "var(--v2-text-dim)", whiteSpace: "nowrap", paddingTop: 2, minWidth: 56 }}>
              {activity.time}
            </span>
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: `${activity.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, flexShrink: 0,
            }}>{activity.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--v2-text)", lineHeight: 1.4 }}>
                {activity.text}
              </div>
              <div style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>{activity.detail}</div>
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
