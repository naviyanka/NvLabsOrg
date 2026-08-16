"use client";

export default function StatCards() {
  const stats = [
    { label: "Active Agents", value: "24", sub: "/32", change: "+12%", changeUp: true, color: "#6366f1", icon: "👤" },
    { label: "Active Tasks", value: "18", sub: "/50", change: "+8%", changeUp: true, color: "#3b82f6", icon: "📋" },
    { label: "Pipelines", value: "7", sub: "/15", change: "+5%", changeUp: true, color: "#22c55e", icon: "⚡" },
    { label: "Token Usage (24h)", value: "1.24M", sub: "", change: "+3%", changeUp: true, color: "#eab308", icon: "🔥" },
    { label: "Est. Spend (24h)", value: "$42.68", sub: "", change: "+7%", changeUp: true, color: "#ef4444", icon: "💰" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
      {stats.map((stat) => (
        <div key={stat.label} className="v2-stat-card" style={{ "--stat-color": stat.color } as any}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "var(--v2-text-muted)" }}>{stat.label}</span>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>{stat.icon}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{stat.value}</span>
            {stat.sub && <span style={{ fontSize: 13, color: "var(--v2-text-muted)" }}>{stat.sub}</span>}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: stat.changeUp ? "var(--v2-green)" : "var(--v2-red)" }}>
            {stat.changeUp ? "↑" : "↓"} {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}
