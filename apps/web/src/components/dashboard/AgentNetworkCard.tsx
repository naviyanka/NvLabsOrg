"use client";

export default function AgentNetworkCard() {
  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div>
          <div className="v2-section-title">Agent Network</div>
          <div className="v2-section-subtitle">24 Active Agents</div>
        </div>
        <span className="v2-section-link">View Office →</span>
      </div>

      {/* Mini office representation */}
      <div style={{
        height: 180, borderRadius: 8, overflow: "hidden",
        background: "linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)",
        border: "1px solid var(--v2-card-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {/* Zones */}
        <div style={{ position: "absolute", inset: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4 }}>
          <Zone name="Planning Zone" color="#a855f7" agents={4} />
          <Zone name="Development Zone" color="#22c55e" agents={8} />
          <Zone name="Analysis Zone" color="#06b6d4" agents={3} />
          <Zone name="Support Zone" color="#f97316" agents={5} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, color: "var(--v2-text-muted)" }}>
        <LegendDot color="var(--v2-green)" label="Working" />
        <LegendDot color="var(--v2-blue)" label="Idle" />
        <LegendDot color="var(--v2-yellow)" label="Review" />
        <LegendDot color="var(--v2-text-dim)" label="Offline" />
      </div>
    </div>
  );
}

function Zone({ name, color, agents }: { name: string; color: string; agents: number }) {
  return (
    <div style={{
      borderRadius: 6, padding: 8,
      border: `1px solid ${color}30`,
      background: `${color}08`,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 8, color: `${color}cc`, fontWeight: 500 }}>{name}</span>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {Array.from({ length: agents }, (_, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: 3,
            background: `${color}40`,
            border: `1px solid ${color}60`,
          }} />
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span>{label}</span>
    </div>
  );
}
