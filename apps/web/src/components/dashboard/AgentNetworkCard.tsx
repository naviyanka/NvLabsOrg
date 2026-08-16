"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/office-store";

const ZONES = [
  { id: "planning", name: "Planning Zone", x: 5, y: 5, w: 40, h: 35, color: "#a855f7" },
  { id: "development", name: "Development Zone", x: 50, y: 5, w: 45, h: 45, color: "#22c55e" },
  { id: "meeting", name: "Meeting Area", x: 50, y: 55, w: 30, h: 25, color: "#eab308" },
  { id: "analysis", name: "Analysis Zone", x: 5, y: 45, w: 35, h: 28, color: "#06b6d4" },
  { id: "support", name: "Support Zone", x: 5, y: 76, w: 40, h: 20, color: "#f97316" },
  { id: "hq", name: "HQ Terminal", x: 60, y: 78, w: 35, h: 18, color: "#3b82f6" },
];

export default function AgentNetworkCard() {
  const agents = useOfficeStore((s) => s.agents);

  const agentList = useMemo(() => {
    return Array.from(agents.values())
      .filter(a => !a.isExternal && !a.agentId.startsWith("reviewer-"))
      .slice(0, 20);
  }, [agents]);

  const activeCount = agentList.length;

  // Distribute agents into zones
  const agentPositions = useMemo(() => {
    return agentList.map((agent, i) => {
      const zone = ZONES[i % ZONES.length];
      // Scatter within zone bounds
      const offsetX = 8 + (i * 7) % (zone.w - 16);
      const offsetY = 12 + (i * 11) % (zone.h - 16);
      const statusColor = agent.status === "working" ? "#22c55e"
        : agent.status === "waiting_approval" ? "#eab308"
        : agent.status === "error" ? "#ef4444"
        : "#4b5563";
      return {
        x: zone.x + offsetX,
        y: zone.y + offsetY,
        name: agent.name,
        status: agent.status,
        statusColor,
        zoneColor: zone.color,
      };
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

      {/* Office Map */}
      <div style={{
        height: 200, borderRadius: 8, overflow: "hidden",
        background: "#080a10",
        border: "1px solid var(--v2-card-border)",
        position: "relative",
      }}>
        {/* Grid floor pattern */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Zones */}
        {ZONES.map(zone => (
          <div
            key={zone.id}
            style={{
              position: "absolute",
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
              border: `1px solid ${zone.color}40`,
              borderRadius: 6,
              background: `${zone.color}08`,
            }}
          >
            <span style={{
              position: "absolute", bottom: 3, left: 5,
              fontSize: 7, color: `${zone.color}99`,
              fontWeight: 500, letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}>
              {zone.name}
            </span>
          </div>
        ))}

        {/* Agent sprites */}
        {agentPositions.map((agent, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${agent.x}%`,
              top: `${agent.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Agent body (pixel-art style) */}
            <div style={{
              width: 14, height: 16, borderRadius: 2,
              background: `${agent.zoneColor}60`,
              border: `1px solid ${agent.zoneColor}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              {/* Head */}
              <div style={{
                width: 8, height: 6, borderRadius: "2px 2px 0 0",
                background: agent.zoneColor,
                marginBottom: 1,
              }} />
              {/* Eyes */}
              <div style={{ display: "flex", gap: 2 }}>
                <div style={{ width: 2, height: 2, background: "#0f0", borderRadius: 1 }} />
                <div style={{ width: 2, height: 2, background: "#0f0", borderRadius: 1 }} />
              </div>
              {/* Status indicator */}
              <div style={{
                position: "absolute", top: -3, right: -3,
                width: 5, height: 5, borderRadius: "50%",
                background: agent.statusColor,
                border: "1px solid #080a10",
                boxShadow: `0 0 4px ${agent.statusColor}`,
              }} />
            </div>
          </div>
        ))}

        {/* Fallback when no agents */}
        {agentPositions.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "var(--v2-text-dim)" }}>No agents deployed</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, color: "var(--v2-text-muted)" }}>
        <LegendDot color="#22c55e" label="Working" />
        <LegendDot color="#3b82f6" label="Idle" />
        <LegendDot color="#eab308" label="Review" />
        <LegendDot color="#4b5563" label="Offline" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 4px ${color}60` }} />
      <span>{label}</span>
    </div>
  );
}
