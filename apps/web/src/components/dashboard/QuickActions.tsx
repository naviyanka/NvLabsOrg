"use client";

export default function QuickActions() {
  const actions = [
    { label: "Add Agent", icon: "👤", color: "#6366f1" },
    { label: "Create Task", icon: "📋", color: "#3b82f6" },
    { label: "New Pipeline", icon: "⚡", color: "#22c55e" },
    { label: "Open HR Room", icon: "🚪", color: "#f97316" },
    { label: "View Office", icon: "🏢", color: "#a855f7" },
  ];

  return (
    <div className="v2-card" style={{ marginBottom: 16 }}>
      <div className="v2-section-title" style={{ marginBottom: 12 }}>Quick Actions</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {actions.map((action) => (
          <button key={action.label} className="v2-quick-action" style={{ borderColor: `${action.color}30` }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: `${action.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>{action.icon}</span>
            <span style={{ fontWeight: 500 }}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
