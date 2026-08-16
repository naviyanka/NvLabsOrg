"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/office-store";

const COLORS = ["#22c55e", "#6366f1", "#3b82f6", "#a855f7", "#06b6d4", "#f97316"];

export default function TopAgents() {
  const agents = useOfficeStore((s) => s.agents);
  const metricsData = useOfficeStore((s) => s.metricsData);

  const topAgents = useMemo(() => {
    const list = Array.from(agents.values()).filter(a => !a.isExternal && !a.agentId.startsWith("reviewer-"));
    return list
      .map((a, i) => {
        const m = metricsData?.agents?.[a.agentId];
        const rate = m && m.taskCount > 0 ? Math.round((m.successCount / m.taskCount) * 100) : 0;
        return { name: a.name, backend: a.backend ?? "default", rate, color: COLORS[i % COLORS.length] };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [agents, metricsData]);

  // Fallback
  if (topAgents.length === 0) {
    return (
      <div className="v2-card">
        <div className="v2-section-header">
          <div className="v2-section-title">Top Agents</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--v2-text-muted)", textAlign: "center", padding: "24px 0" }}>
          Hire agents to see rankings
        </div>
      </div>
    );
  }

  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div className="v2-section-title">Top Agents</div>
        <span className="v2-section-link">View All →</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {topAgents.map((agent) => (
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
