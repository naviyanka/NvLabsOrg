"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useOfficeStore } from "@/store/office-store";

/**
 * Realistic Office View
 *
 * Same approach as the existing PixelOfficeScene:
 * - Container maintains the background image's aspect ratio (3:2)
 * - Image fills exactly (no gaps, no crop)
 * - Agents positioned with percentage coordinates on top
 * - Zone labels overlaid
 */

const IMAGE_ASPECT = 1536 / 1024; // 3:2

// Desk positions (percentage of image width/height)
// Mapped to the 3x3 room grid visible in the reference image
const DESK_POSITIONS = [
  // Top-left room
  { x: 12, y: 18 }, { x: 19, y: 18 }, { x: 12, y: 26 }, { x: 19, y: 26 },
  // Top-center room
  { x: 40, y: 18 }, { x: 47, y: 18 }, { x: 40, y: 26 }, { x: 47, y: 26 },
  // Top-right room
  { x: 68, y: 18 }, { x: 75, y: 18 }, { x: 68, y: 26 }, { x: 75, y: 26 },
  // Mid-left room
  { x: 12, y: 46 }, { x: 19, y: 46 }, { x: 12, y: 54 }, { x: 19, y: 54 },
  // Center (meeting room — round table seats)
  { x: 43, y: 46 }, { x: 50, y: 43 }, { x: 55, y: 48 }, { x: 48, y: 53 },
  // Mid-right room
  { x: 68, y: 46 }, { x: 75, y: 46 }, { x: 68, y: 54 }, { x: 75, y: 54 },
  // Bottom-left room
  { x: 12, y: 74 }, { x: 19, y: 74 }, { x: 12, y: 82 }, { x: 19, y: 82 },
  // Bottom-center room
  { x: 40, y: 74 }, { x: 47, y: 74 }, { x: 40, y: 82 }, { x: 47, y: 82 },
  // Bottom-right room
  { x: 68, y: 74 }, { x: 75, y: 74 }, { x: 68, y: 82 }, { x: 75, y: 82 },
];

// Zone labels
const ZONE_LABELS = [
  { name: "Planning Zone", x: 15, y: 11, color: "#a855f7" },
  { name: "Development Zone", x: 44, y: 11, color: "#22c55e" },
  { name: "QA & Security Zone", x: 72, y: 11, color: "#f97316" },
  { name: "Data Zone", x: 15, y: 39, color: "#06b6d4" },
  { name: "Meeting Area", x: 49, y: 39, color: "#eab308" },
  { name: "Automation Zone", x: 72, y: 39, color: "#3b82f6" },
  { name: "Research Zone", x: 15, y: 67, color: "#ec4899" },
  { name: "Operations Zone", x: 44, y: 67, color: "#84cc16" },
  { name: "Support Zone", x: 72, y: 67, color: "#14b8a6" },
];

const ENTRANCE = { x: 50, y: 3 };
const AVATAR_COLORS = ["#22c55e", "#6366f1", "#3b82f6", "#a855f7", "#06b6d4", "#f97316", "#ec4899", "#eab308"];

export default function RealisticOfficeView() {
  const agents = useOfficeStore((s) => s.agents);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const agentNodes = useMemo(() => {
    const list = Array.from(agents.values())
      .filter(a => !a.isExternal && !a.agentId.startsWith("reviewer-"));

    return list.map((agent, i) => {
      const desk = DESK_POSITIONS[i % DESK_POSITIONS.length];
      const color = AVATAR_COLORS[agent.palette ?? (i % AVATAR_COLORS.length)];
      return {
        id: agent.agentId,
        name: agent.name,
        desk,
        color,
        status: agent.status,
        isWorking: agent.status === "working",
      };
    });
  }, [agents]);

  return (
    <div style={{
      width: "100%",
      maxHeight: "60vh",
      position: "relative",
      borderRadius: 10,
      overflow: "hidden",
      background: "#080a10",
    }}>
      {/* Aspect ratio wrapper — image fills exactly */}
      <div style={{ position: "relative", width: "100%", paddingBottom: `${(1 / IMAGE_ASPECT) * 100}%` }}>
        <div style={{ position: "absolute", inset: 0 }}>

      {/* Background — fills exactly, no crop, no gap */}
      <img
        src="/offices/realistic-office.png"
        alt="Office"
        draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" }}
        onError={(e) => { (e.target as HTMLImageElement).src = "/offices/cyberpunk.jpeg"; }}
      />

      {/* Zone Labels */}
      {ZONE_LABELS.map(z => (
        <div key={z.name} style={{
          position: "absolute", left: `${z.x}%`, top: `${z.y}%`, transform: "translateX(-50%)",
          padding: "2px 8px", borderRadius: 4,
          background: `${z.color}40`, border: `1px solid ${z.color}80`,
          fontSize: 9, fontWeight: 600, color: z.color,
          whiteSpace: "nowrap", pointerEvents: "none",
          boxShadow: `0 0 8px ${z.color}25`,
        }}>
          {z.name}
        </div>
      ))}

      {/* Agent Avatars */}
      {agentNodes.map((agent, i) => (
        <AgentSprite
          key={agent.id}
          desk={agent.desk}
          color={agent.color}
          name={agent.name}
          isWorking={agent.isWorking}
          status={agent.status}
          delay={i * 0.4}
          noAnimation={reducedMotion.current}
        />
      ))}

      {/* Empty state */}
      {agentNodes.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ padding: "12px 20px", borderRadius: 8, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
            Hire agents to see them at their desks
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
}

// ─── Agent Sprite ───
function AgentSprite({ desk, color, name, isWorking, status, delay, noAnimation }: {
  desk: { x: number; y: number }; color: string; name: string;
  isWorking: boolean; status: string; delay: number; noAnimation: boolean;
}) {
  const [arrived, setArrived] = useState(noAnimation);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (noAnimation) return;
    const t = setTimeout(() => setArrived(true), delay * 1000 + 50);
    return () => clearTimeout(t);
  }, [delay, noAnimation]);

  const x = arrived ? desk.x : ENTRANCE.x;
  const y = arrived ? desk.y : ENTRANCE.y;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: `${x}%`, top: `${y}%`,
        transform: "translate(-50%, -50%)",
        transition: noAnimation ? "none" : `left ${1 + delay * 0.15}s ease, top ${1 + delay * 0.15}s ease`,
        cursor: "pointer", zIndex: 10,
      }}
    >
      {/* Glow base */}
      <div style={{
        width: isWorking ? 14 : 10, height: isWorking ? 14 : 10,
        borderRadius: "50%", background: color,
        boxShadow: `0 0 ${isWorking ? 12 : 6}px ${color}, 0 0 ${isWorking ? 24 : 12}px ${color}50`,
        animation: isWorking ? "agent-breathe 2s ease-in-out infinite" : "none",
        border: "2px solid rgba(0,0,0,0.4)",
      }} />

      {/* Name tooltip */}
      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          padding: "3px 8px", borderRadius: 4,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
          border: `1px solid ${color}60`,
          fontSize: 9, color: "#fff", whiteSpace: "nowrap",
        }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ marginLeft: 4, color, fontSize: 8 }}>● {status}</span>
        </div>
      )}
    </div>
  );
}
