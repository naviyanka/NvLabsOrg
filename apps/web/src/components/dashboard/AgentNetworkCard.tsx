"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/office-store";

/**
 * Agent Network — constellation view
 * 
 * Each agent is a node in a living network. Working agents pulse,
 * idle agents glow dimly, connections show team bonds.
 * The team lead sits at center; others orbit around it.
 */

export default function AgentNetworkCard() {
  const agents = useOfficeStore((s) => s.agents);

  const agentList = useMemo(() => {
    return Array.from(agents.values())
      .filter(a => !a.isExternal && !a.agentId.startsWith("reviewer-"));
  }, [agents]);

  const activeCount = agentList.length;
  const workingCount = agentList.filter(a => a.status === "working").length;

  // Position agents in a circular constellation
  const nodes = useMemo(() => {
    if (agentList.length === 0) return [];
    const cx = 50, cy = 50;
    const radius = agentList.length === 1 ? 0 : Math.min(32, 18 + agentList.length * 2);

    return agentList.map((agent, i) => {
      const angle = (i / agentList.length) * Math.PI * 2 - Math.PI / 2;
      const x = agentList.length === 1 ? cx : cx + Math.cos(angle) * radius;
      const y = agentList.length === 1 ? cy : cy + Math.sin(angle) * radius;
      const isWorking = agent.status === "working";
      const isError = agent.status === "error";
      const isWaiting = agent.status === "waiting_approval";
      const color = isWorking ? "#22c55e" : isError ? "#ef4444" : isWaiting ? "#eab308" : "#6366f1";
      const size = isWorking ? 7 : 5;

      return { x, y, color, size, name: agent.name, status: agent.status, isWorking, isTeamLead: agent.isTeamLead, backend: agent.backend };
    });
  }, [agentList]);

  return (
    <div className="v2-card">
      <div className="v2-section-header">
        <div>
          <div className="v2-section-title">Agent Network</div>
          <div className="v2-section-subtitle">{activeCount} Active Agents</div>
        </div>
        <span className="v2-section-link">View Office →</span>
      </div>

      {/* Constellation view */}
      <div style={{
        height: 200, borderRadius: 8, overflow: "hidden",
        background: "radial-gradient(ellipse at center, #0f1320 0%, #080a10 100%)",
        border: "1px solid var(--v2-card-border)",
        position: "relative",
      }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          {/* Background particles */}
          {Array.from({ length: 30 }, (_, i) => (
            <circle
              key={`star-${i}`}
              cx={10 + (i * 37) % 80}
              cy={5 + (i * 53) % 90}
              r={0.3 + (i % 3) * 0.2}
              fill="rgba(255,255,255,0.15)"
            />
          ))}

          {/* Connection lines between agents */}
          {nodes.length > 1 && nodes.map((node, i) => {
            // Connect to next node and to center if team lead exists
            const next = nodes[(i + 1) % nodes.length];
            return (
              <line
                key={`conn-${i}`}
                x1={node.x} y1={node.y}
                x2={next.x} y2={next.y}
                stroke={node.isWorking ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.08)"}
                strokeWidth={0.3}
                strokeDasharray={node.isWorking ? "none" : "1 1"}
              />
            );
          })}

          {/* Team lead center hub (if any) */}
          {nodes.some(n => n.isTeamLead) && (
            <>
              <circle cx={50} cy={50} r={12} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth={0.3} strokeDasharray="2 2" />
              <circle cx={50} cy={50} r={20} fill="none" stroke="rgba(99,102,241,0.05)" strokeWidth={0.2} />
            </>
          )}

          {/* Agent nodes */}
          {nodes.map((node, i) => (
            <g key={i}>
              {/* Outer glow ring */}
              <circle
                cx={node.x} cy={node.y} r={node.size + 2}
                fill="none"
                stroke={node.color}
                strokeWidth={0.4}
                opacity={node.isWorking ? 0.6 : 0.2}
              >
                {node.isWorking && (
                  <animate attributeName="r" values={`${node.size + 1};${node.size + 3};${node.size + 1}`} dur="2s" repeatCount="indefinite" />
                )}
                {node.isWorking && (
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                )}
              </circle>

              {/* Core dot */}
              <circle
                cx={node.x} cy={node.y} r={node.size}
                fill={node.color}
                opacity={node.isWorking ? 0.9 : 0.5}
                filter={node.isWorking ? "url(#glow)" : "none"}
              />

              {/* Team lead crown indicator */}
              {node.isTeamLead && (
                <text x={node.x} y={node.y - node.size - 3} textAnchor="middle" fontSize="4" fill="#eab308">★</text>
              )}

              {/* Name label */}
              <text
                x={node.x}
                y={node.y + node.size + 5}
                textAnchor="middle"
                fontSize="3"
                fill="rgba(255,255,255,0.6)"
                fontFamily="Inter, sans-serif"
              >
                {node.name}
              </text>
            </g>
          ))}

          {/* Glow filter */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1px dashed rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16, opacity: 0.4 }}>+</span>
            </div>
            <span style={{ fontSize: 10, color: "var(--v2-text-dim)" }}>Hire agents to see the network</span>
          </div>
        )}

        {/* Pulse indicator overlay */}
        {workingCount > 0 && (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--v2-green)" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--v2-green)", animation: "pulse 1.5s infinite" }} />
            {workingCount} active
          </div>
        )}
      </div>

      {/* Bottom stats bar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "0 4px" }}>
        <StatPill color="#22c55e" count={workingCount} label="Working" />
        <StatPill color="#6366f1" count={agentList.filter(a => a.status === "idle" || a.status === "done").length} label="Idle" />
        <StatPill color="#eab308" count={agentList.filter(a => a.status === "waiting_approval").length} label="Review" />
        <StatPill color="#4b5563" count={0} label="Offline" />
      </div>
    </div>
  );
}

function StatPill({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: count > 0 ? `0 0 6px ${color}60` : "none" }} />
      <span style={{ color: count > 0 ? "var(--v2-text)" : "var(--v2-text-dim)" }}>{label}</span>
      {count > 0 && <span style={{ color, fontWeight: 600 }}>{count}</span>}
    </div>
  );
}
