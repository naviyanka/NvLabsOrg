"use client";

import { UserPlus, ClipboardPlus, Workflow, DoorOpen, Building2 } from "lucide-react";

export default function QuickActions() {
  const actions = [
    { label: "Add Agent", Icon: UserPlus, color: "#6366f1" },
    { label: "Create Task", Icon: ClipboardPlus, color: "#3b82f6" },
    { label: "New Pipeline", Icon: Workflow, color: "#22c55e" },
    { label: "Open HR Room", Icon: DoorOpen, color: "#f97316" },
    { label: "View Office", Icon: Building2, color: "#a855f7" },
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
              color: action.color,
            }}><action.Icon size={14} /></span>
            <span style={{ fontWeight: 500 }}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
