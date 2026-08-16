"use client";

export default function RecentTasks() {
  const tasks = [
    { name: "Analyze target.com", agent: "Agent Omega", progress: 75, time: "10:24 AM", color: "#6366f1" },
    { name: "Generate report v2", agent: "Agent Nova", progress: 45, time: "10:20 AM", color: "#22c55e" },
    { name: "Deploy staging env", agent: "Agent Rex", progress: 90, time: "10:15 AM", color: "#3b82f6" },
  ];

  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div className="v2-section-title">Recent Tasks</div>
        <span className="v2-section-link">View All →</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tasks.map((task) => (
          <div key={task.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${task.color}15`, border: `1px solid ${task.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: task.color, fontWeight: 600,
            }}>
              {task.agent.split(" ")[1]?.[0] ?? "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--v2-text)" }}>{task.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>{task.agent}</span>
                <div className="v2-progress" style={{ flex: 1, maxWidth: 80 }}>
                  <div className="v2-progress-bar" style={{ width: `${task.progress}%`, background: task.color }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>{task.progress}%</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: "var(--v2-text-dim)" }}>{task.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
