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

// Image occupies: x=0-100%, y=16.7%-83.3% when contained in a square
// To convert image-relative % to container-relative %: containerY = IMG_TOP + (imageY * IMG_SCALE)
const IMG_TOP = 16.7;
const IMG_SCALE = 0.667;

// Helper to convert image-space coords to container-space
const p = (x: number, iy: number) => ({ x, y: IMG_TOP + iy * IMG_SCALE });

// Desk positions in container coordinates
const DESK_POSITIONS = [
  // Top-left room (Planning)
  p(16.5, 19), p(19, 19), p(16, 28.5), p(19, 28.5),
  // Top-center room (Development)
  p(44, 19), p(47, 19), p(44, 28), p(47, 28),
  // Top-right room (QA & Security)
  p(72, 19), p(75, 19), p(73, 28), p(75, 28),
  // Mid-left room (Data)
  p(15.5, 44), p(19.5, 44), p(15.5, 50), p(18.5, 50),
  // Center (Meeting room)
  p(46.5, 49.5), p(51.5, 41), p(56, 45), p(51.5, 54.5),
  // Mid-right room (Automation)
  p(73, 44), p(76, 44), p(74.5, 50), p(77.5, 50),
  // Bottom-left room (Research)
  p(16.5, 69), p(24.5, 69), p(12.5, 86), p(26, 86),
  // Bottom-center room (Operations)
  p(46.8, 69), p(57.2, 69), p(45.5, 86), p(48.2, 86),
  // Bottom-right room (Support)
  p(76, 69), p(87, 69), p(86.2, 86.5), p(88.6, 86.5),
];

// Zone labels in container coordinates
const ZONE_LABELS = [
  { name: "Planning Zone", x: 23, y: IMG_TOP + 7.5 * IMG_SCALE, color: "#a855f7" },
  { name: "Development Zone", x: 52, y: IMG_TOP + 7.5 * IMG_SCALE, color: "#22c55e" },
  { name: "QA & Security Zone", x: 80, y: IMG_TOP + 7.5 * IMG_SCALE, color: "#f97316" },
  { name: "Data Zone", x: 22.5, y: IMG_TOP + 34 * IMG_SCALE, color: "#06b6d4" },
  { name: "Meeting Area", x: 52, y: IMG_TOP + 34 * IMG_SCALE, color: "#eab308" },
  { name: "Automation Zone", x: 81, y: IMG_TOP + 34 * IMG_SCALE, color: "#3b82f6" },
  { name: "Research Zone", x: 21, y: IMG_TOP + 60 * IMG_SCALE, color: "#ec4899" },
  { name: "Operations Zone", x: 52, y: IMG_TOP + 60 * IMG_SCALE, color: "#84cc16" },
  { name: "Support Zone", x: 81, y: IMG_TOP + 60 * IMG_SCALE, color: "#14b8a6" },
];

const ENTRANCE = { x: 50, y: IMG_TOP };
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
      position: "relative",
      borderRadius: 10,
      overflow: "hidden",
      background: "#080a10",
    }}>
      {/* Container — crops bottom dark bar */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "56%" }}>
        <div style={{ position: "absolute", inset: 0 }}>

      {/* Background — cover from top, trims dark floor */}
      <img
        src="/offices/realistic-office.png"
        alt="Office"
        draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "115%", objectFit: "cover", objectPosition: "top center", display: "block" }}
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

      {/* DEBUG: Desk position markers — remove after alignment */}
      {DESK_POSITIONS.map((desk, i) => (
        <div key={`debug-${i}`} style={{
          position: "absolute", left: `${desk.x}%`, top: `${desk.y}%`,
          transform: "translate(-50%, -50%)",
          width: 16, height: 16, borderRadius: "50%",
          background: "rgba(255, 0, 0, 0.7)",
          border: "2px solid #fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 7, fontWeight: 700, color: "#fff",
          pointerEvents: "none", zIndex: 50,
        }}>
          {i}
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
