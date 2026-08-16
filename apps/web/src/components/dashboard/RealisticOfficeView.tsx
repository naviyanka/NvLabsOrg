"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useOfficeStore } from "@/store/office-store";

// ─── Zone Layout (3x3 grid + center meeting room) ───
// Coordinates are percentages relative to the background image
const ZONES = [
  { id: "planning", name: "Planning Zone", row: 0, col: 0, desks: [{ x: 10, y: 14 }, { x: 18, y: 14 }, { x: 10, y: 22 }, { x: 18, y: 22 }] },
  { id: "development", name: "Development Zone", row: 0, col: 1, desks: [{ x: 40, y: 14 }, { x: 48, y: 14 }, { x: 40, y: 22 }, { x: 48, y: 22 }] },
  { id: "qa-security", name: "QA & Security", row: 0, col: 2, desks: [{ x: 70, y: 14 }, { x: 78, y: 14 }, { x: 70, y: 22 }, { x: 78, y: 22 }] },
  { id: "data", name: "Data Zone", row: 1, col: 0, desks: [{ x: 10, y: 44 }, { x: 18, y: 44 }, { x: 10, y: 52 }, { x: 18, y: 52 }] },
  { id: "meeting", name: "Meeting Room", row: 1, col: 1, desks: [{ x: 42, y: 44 }, { x: 50, y: 44 }, { x: 42, y: 52 }, { x: 50, y: 52 }, { x: 46, y: 48 }] },
  { id: "automation", name: "Automation Zone", row: 1, col: 2, desks: [{ x: 70, y: 44 }, { x: 78, y: 44 }, { x: 70, y: 52 }, { x: 78, y: 52 }] },
  { id: "research", name: "Research Zone", row: 2, col: 0, desks: [{ x: 10, y: 72 }, { x: 18, y: 72 }, { x: 10, y: 80 }, { x: 18, y: 80 }] },
  { id: "operations", name: "Operations Zone", row: 2, col: 1, desks: [{ x: 40, y: 72 }, { x: 48, y: 72 }, { x: 40, y: 80 }, { x: 48, y: 80 }] },
  { id: "support", name: "Support Zone", row: 2, col: 2, desks: [{ x: 70, y: 72 }, { x: 78, y: 72 }, { x: 70, y: 80 }, { x: 78, y: 80 }] },
];

// Entry point (top center corridor)
const ENTRANCE = { x: 46, y: 2 };

// Corridor waypoints (cross shape connecting all zones to entrance)
const CORRIDOR_Y_TOP = 8;
const CORRIDOR_Y_MID = 38;
const CORRIDOR_Y_BOT = 66;
const CORRIDOR_X_LEFT = 14;
const CORRIDOR_X_MID = 46;
const CORRIDOR_X_RIGHT = 74;

// ─── Avatar Colors ───
const AVATAR_COLORS = ["#22c55e", "#6366f1", "#3b82f6", "#a855f7", "#06b6d4", "#f97316", "#ec4899", "#eab308"];

// ─── Main Component ───
export default function RealisticOfficeView() {
  const agents = useOfficeStore((s) => s.agents);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Assign agents to desks
  const agentPositions = useMemo(() => {
    const agentList = Array.from(agents.values())
      .filter(a => !a.isExternal && !a.agentId.startsWith("reviewer-"));

    return agentList.map((agent, i) => {
      const zoneIdx = i % ZONES.length;
      const zone = ZONES[zoneIdx];
      const deskIdx = Math.floor(i / ZONES.length) % zone.desks.length;
      const desk = zone.desks[deskIdx];
      const color = AVATAR_COLORS[agent.palette ?? (i % AVATAR_COLORS.length)];
      const isWorking = agent.status === "working";
      const isIdle = agent.status === "idle" || agent.status === "done";
      const isOffline = agent.status === "error";

      return {
        agentId: agent.agentId,
        name: agent.name,
        x: desk.x,
        y: desk.y,
        color,
        status: agent.status,
        isWorking,
        isIdle,
        isOffline,
        zone: zone.id,
      };
    });
  }, [agents]);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: "#080a10" }}>
      {/* Background Image — fills edge to edge */}
      <img
        src="/offices/realistic-office.png"
        alt="Office floor plan"
        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/offices/cyberpunk.jpeg";
        }}
      />

      {/* Vignette overlay */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />

      {/* Zone name labels (floating on the image) */}
      <ZoneLabel name="Planning Zone" color="#a855f7" top="8%" left="16%" />
      <ZoneLabel name="Development Zone" color="#22c55e" top="8%" left="44%" />
      <ZoneLabel name="QA & Security Zone" color="#f97316" top="8%" left="74%" />
      <ZoneLabel name="Data Zone" color="#06b6d4" top="38%" left="16%" />
      <ZoneLabel name="Meeting Area" color="#eab308" top="38%" left="44%" />
      <ZoneLabel name="Automation Zone" color="#3b82f6" top="38%" left="74%" />
      <ZoneLabel name="Research Zone" color="#ec4899" top="68%" left="16%" />
      <ZoneLabel name="Operations Zone" color="#84cc16" top="68%" left="44%" />
      <ZoneLabel name="Support Zone" color="#14b8a6" top="68%" left="74%" />

      {/* Zone hover areas (invisible interaction layer) */}
      {ZONES.map(zone => {
        const left = zone.col === 0 ? "2%" : zone.col === 1 ? "33%" : "64%";
        const top = zone.row === 0 ? "2%" : zone.row === 1 ? "34%" : "64%";
        const isHovered = hoveredZone === zone.id;
        return (
          <div
            key={zone.id}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
            style={{
              position: "absolute", left, top, width: "32%", height: "31%",
              borderRadius: 8, cursor: "pointer",
              border: isHovered ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
              background: isHovered ? "rgba(99,102,241,0.06)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            {/* Zone label (shows on hover) */}
            {isHovered && (
              <div style={{
                position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
                padding: "3px 10px", borderRadius: 4,
                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                border: "1px solid rgba(99,102,241,0.4)",
                fontSize: 10, fontWeight: 500, color: "#fff",
                whiteSpace: "nowrap",
              }}>
                {zone.name}
              </div>
            )}
          </div>
        );
      })}

      {/* Agent Avatars */}
      {agentPositions.map((agent, i) => (
        <AgentAvatar
          key={agent.agentId}
          x={agent.x}
          y={agent.y}
          color={agent.color}
          name={agent.name}
          status={agent.status}
          isWorking={agent.isWorking}
          delay={i * 0.3}
          reducedMotion={prefersReducedMotion.current}
        />
      ))}

      {/* Empty state */}
      {agentPositions.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ padding: "16px 24px", borderRadius: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#fff", marginBottom: 4 }}>Office is empty</div>
            <div style={{ fontSize: 11, color: "var(--v2-text-muted)" }}>Hire agents to see them appear at their desks</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent Avatar Component ───
function AgentAvatar({ x, y, color, name, status, isWorking, delay, reducedMotion }: {
  x: number; y: number; color: string; name: string; status: string;
  isWorking: boolean; delay: number; reducedMotion: boolean;
}) {
  const [arrived, setArrived] = useState(reducedMotion);
  const [showName, setShowName] = useState(false);

  // Walk-in animation: start at entrance, move to desk
  useEffect(() => {
    if (reducedMotion) { setArrived(true); return; }
    const timer = setTimeout(() => setArrived(true), delay * 1000 + 100);
    return () => clearTimeout(timer);
  }, [delay, reducedMotion]);

  const currentX = arrived ? x : ENTRANCE.x;
  const currentY = arrived ? y : ENTRANCE.y;

  return (
    <div
      onMouseEnter={() => setShowName(true)}
      onMouseLeave={() => setShowName(false)}
      style={{
        position: "absolute",
        left: `${currentX}%`,
        top: `${currentY}%`,
        transform: "translate(-50%, -50%)",
        transition: reducedMotion ? "none" : `left ${1.2 + delay * 0.2}s ease-out, top ${1.2 + delay * 0.2}s ease-out`,
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      {/* Avatar body — isometric humanoid silhouette */}
      <div style={{ position: "relative" }}>
        {/* Glow underneath */}
        <div style={{
          position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)",
          width: 14, height: 6, borderRadius: "50%",
          background: color, opacity: isWorking ? 0.4 : 0.15,
          filter: `blur(3px)`,
        }} />

        {/* Body */}
        <svg width="16" height="24" viewBox="0 0 16 24" style={{ display: "block" }}>
          {/* Head */}
          <circle cx="8" cy="4" r="3.5" fill="#1e293b" stroke={color} strokeWidth="0.8" />
          {/* Body */}
          <path d="M5 8 L8 7 L11 8 L11 16 L5 16 Z" fill="#1e293b" stroke={color} strokeWidth="0.6" />
          {/* Legs */}
          <rect x="5.5" y="16" width="2" height="6" rx="1" fill="#1e293b" stroke={color} strokeWidth="0.4" />
          <rect x="8.5" y="16" width="2" height="6" rx="1" fill="#1e293b" stroke={color} strokeWidth="0.4" />
          {/* Accent glow on chest */}
          <circle cx="8" cy="12" r="1.5" fill={color} opacity={isWorking ? 0.8 : 0.3}>
            {isWorking && (
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            )}
          </circle>
        </svg>

        {/* Status ring */}
        {isWorking && (
          <div style={{
            position: "absolute", inset: -4,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            opacity: 0.3,
            animation: "avatar-ring-pulse 2s infinite",
          }} />
        )}
      </div>

      {/* Name tooltip */}
      {showName && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
          marginBottom: 4, padding: "2px 8px", borderRadius: 4,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          fontSize: 9, color: "#fff", whiteSpace: "nowrap",
          border: `1px solid ${color}50`,
        }}>
          {name}
          <span style={{ marginLeft: 4, fontSize: 8, color, textTransform: "capitalize" }}>● {status}</span>
        </div>
      )}
    </div>
  );
}


// ─── Zone Label ───
function ZoneLabel({ name, color, top, left }: { name: string; color: string; top: string; left: string }) {
  return (
    <div style={{
      position: "absolute", top, left, transform: "translateX(-50%)",
      padding: "3px 10px", borderRadius: 4,
      background: `${color}40`, border: `1px solid ${color}80`,
      fontSize: 9, fontWeight: 600, color,
      whiteSpace: "nowrap", pointerEvents: "none",
      boxShadow: `0 0 10px ${color}30`,
      letterSpacing: "0.02em",
    }}>
      {name}
    </div>
  );
}
