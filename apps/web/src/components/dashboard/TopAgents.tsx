"use client";

export default function TopAgents() {
  const agents = [
    { name: "Alpha", backend: "Gemini 1.5 Pro", rate: 96, color: "#22c55e" },
    { name: "Hash", backend: "Claude 3.5 Sonnet", rate: 89, color: "#6366f1" },
    { name: "Nova", backend: "GPT-4o", rate: 84, color: "#3b82f6" },
    { name: "Cipher", backend: "Claude Sonnet", rate: 78, color: "#a855f7" },
  ];

  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div className="v2-section-title">Top Agents</div>
        <span className="v2-section-link">View All →</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {agents.map((agent) => (
          <div key={agent.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `${agent.color}20`, border: `2px solid ${agent.color}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, color: agent.color,
            }}>
              {agent.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--v2-text)" }}>{agent.name}</div>
              <div style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>Backend: {agent.backend}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: agent.color }}>{agent.rate}%</span>
              <div className="v2-progress" style={{ width: 60 }}>
                <div className="v2-progress-bar" style={{ width: `${agent.rate}%`, background: agent.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
