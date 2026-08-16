"use client";

export default function PipelineExecutionCard() {
  const pipelines = [
    { name: "Bug Bounty Recon Pipeline", progress: 85, color: "#ef4444" },
    { name: "Code Review Automation", progress: 62, color: "#22c55e" },
    { name: "Threat Intel Collector", progress: 45, color: "#3b82f6" },
    { name: "Content Generation Flow", progress: 30, color: "#a855f7" },
  ];

  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div>
          <div className="v2-section-title">Pipeline Execution</div>
          <div className="v2-section-subtitle">7 Running Pipelines</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="v2-section-link">View All →</span>
          <select style={{
            background: "var(--v2-card)", border: "1px solid var(--v2-card-border)",
            borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "var(--v2-text-muted)",
            outline: "none",
          }}>
            <option>All</option>
            <option>Running</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {pipelines.map((p) => (
          <div key={p.name}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--v2-text)" }}>{p.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--v2-text)" }}>{p.progress}%</span>
                <button style={{
                  width: 18, height: 18, borderRadius: "50%", border: "none",
                  background: `${p.color}20`, color: p.color, fontSize: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>▶</button>
              </div>
            </div>
            <div className="v2-progress">
              <div className="v2-progress-bar" style={{ width: `${p.progress}%`, background: p.color }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--v2-text-muted)" }}>
        + 3 More Pipelines
      </div>
    </div>
  );
}
