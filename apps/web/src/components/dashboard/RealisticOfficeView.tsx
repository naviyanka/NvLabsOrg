"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useOfficeStore } from "@/store/office-store";
import dynamic from "next/dynamic";

const SpriteAvatar = dynamic(() => import("@/components/office/ui/SpriteAvatar"), { ssr: false });
import RealisticAvatar from "./RealisticAvatar";

// Realistic character spritesheets (palette index → path)
const REALISTIC_SPRITES: Record<number, string> = {
  6: "/assets/characters/realistic_secretary.png",
};

// Load character sprite assets (needed for SpriteAvatar to render)
let assetsLoaded = false;
async function ensureAssetsLoaded() {
  if (assetsLoaded) return;
  try {
    const { loadAllAssets } = await import("@/components/office/sprites/assetLoader");
    await loadAllAssets();
    assetsLoaded = true;
  } catch (e) {
    console.warn("[RealisticOffice] Failed to load sprite assets:", e);
  }
}

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
  p(20.3, -8), p(29.8, -7.8), p(16.2, 17.5), p(28.5, 17.5),
  // Top-center room (Development)
  p(47, -7.5), p(55.77, -7.5), p(43.9, 18.9), p(46.7, 18.9),
  // Top-right room (QA & Security)
  p(73.5, -7), p(81.3, -7), p(72.7, 18), p(75.4, 18),
  // Mid-left room (Data)
  p(16.5, 44), p(20.2, 44), p(15.9, 54.7), p(18.5, 54.7),
  // Center (Meeting room)
  p(46.5, 45.5), p(51.4, 39), p(56, 45), p(51.5, 62.5),
  // Mid-right room (Automation)
  p(75.8, 44), p(87, 44), p(74.8, 54.3), p(77.5, 54.3),
  // Bottom-left room (Research)
  p(16.5, 87.3), p(24, 98), p(12.5, 117), p(27.4, 106),
  // Bottom-center room (Operations)
  p(46.8, 87), p(57.2, 87), p(45.3, 116.8), p(58.7, 116.65),
  // Bottom-right room (Support)
  p(76, 87), p(87, 87), p(86.1, 116.9), p(88.6, 116.5),
];

// Zone labels in container coordinates
const ZONE_LABELS = [
  { name: "Planning Zone", x: 23, y: IMG_TOP + -18.5 * IMG_SCALE, color: "#a855f7" },
  { name: "Development Zone", x: 51, y: IMG_TOP + -18.5 * IMG_SCALE, color: "#22c55e" },
  { name: "QA & Security Zone", x: 80, y: IMG_TOP + -18.5 * IMG_SCALE, color: "#f97316" },
  { name: "Data Zone", x: 22.5, y: IMG_TOP + 27.8 * IMG_SCALE, color: "#06b6d4" },
  { name: "Meeting Area", x: 52, y: IMG_TOP + 25.8 * IMG_SCALE, color: "#eab308" },
  { name: "Automation Zone", x: 81, y: IMG_TOP + 27.8 * IMG_SCALE, color: "#3b82f6" },
  { name: "Research Zone", x: 21, y: IMG_TOP + 71 * IMG_SCALE, color: "#ec4899" },
  { name: "Operations Zone", x: 52, y: IMG_TOP + 71 * IMG_SCALE, color: "#84cc16" },
  { name: "Support Zone", x: 81, y: IMG_TOP + 71 * IMG_SCALE, color: "#14b8a6" },
];

const ENTRANCE = { x: 50, y: IMG_TOP };

// ─── Hallway Waypoints ───
// Central corridors that agents walk through to reach their zones
// Horizontal corridor: y ~33% of image (between top row and mid row)
// Vertical corridor: x ~35% and x ~65% (between left/center and center/right)
const HALL_TOP = p(50, 30);      // Top of central vertical corridor
const HALL_MID = p(50, 50);      // Center junction (meeting room level)
const HALL_BOT = p(50, 75);      // Bottom of central vertical corridor
const HALL_LEFT_TOP = p(32, 30); // Left corridor junction (top)
const HALL_LEFT_MID = p(32, 50); // Left corridor junction (mid)
const HALL_LEFT_BOT = p(32, 75); // Left corridor junction (bottom)
const HALL_RIGHT_TOP = p(67, 30); // Right corridor junction (top)
const HALL_RIGHT_MID = p(67, 50); // Right corridor junction (mid)
const HALL_RIGHT_BOT = p(67, 75); // Right corridor junction (bottom)

// Path from entrance to each zone's gate (array of waypoints to walk through)
const ZONE_PATHS: Record<number, Array<{ x: number; y: number }>> = {
  // Planning (desks 0-3): entrance → top → left
  0: [HALL_TOP, HALL_LEFT_TOP],
  1: [HALL_TOP, HALL_LEFT_TOP],
  2: [HALL_TOP, HALL_LEFT_TOP],
  3: [HALL_TOP, HALL_LEFT_TOP],
  // Development (desks 4-7): entrance → top (already there)
  4: [HALL_TOP],
  5: [HALL_TOP],
  6: [HALL_TOP],
  7: [HALL_TOP],
  // QA & Security (desks 8-11): entrance → top → right
  8: [HALL_TOP, HALL_RIGHT_TOP],
  9: [HALL_TOP, HALL_RIGHT_TOP],
  10: [HALL_TOP, HALL_RIGHT_TOP],
  11: [HALL_TOP, HALL_RIGHT_TOP],
  // Data (desks 12-15): entrance → top → left → left-mid
  12: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID],
  13: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID],
  14: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID],
  15: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID],
  // Meeting (desks 16-19): entrance → mid
  16: [HALL_TOP, HALL_MID],
  17: [HALL_TOP, HALL_MID],
  18: [HALL_TOP, HALL_MID],
  19: [HALL_TOP, HALL_MID],
  // Automation (desks 20-23): entrance → top → right → right-mid
  20: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID],
  21: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID],
  22: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID],
  23: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID],
  // Research (desks 24-27): entrance → top → left → left-mid → left-bot
  24: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID, HALL_LEFT_BOT],
  25: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID, HALL_LEFT_BOT],
  26: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID, HALL_LEFT_BOT],
  27: [HALL_TOP, HALL_LEFT_TOP, HALL_LEFT_MID, HALL_LEFT_BOT],
  // Operations (desks 28-31): entrance → mid → bot
  28: [HALL_TOP, HALL_MID, HALL_BOT],
  29: [HALL_TOP, HALL_MID, HALL_BOT],
  30: [HALL_TOP, HALL_MID, HALL_BOT],
  31: [HALL_TOP, HALL_MID, HALL_BOT],
  // Support (desks 32-35): entrance → top → right → right-mid → right-bot
  32: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID, HALL_RIGHT_BOT],
  33: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID, HALL_RIGHT_BOT],
  34: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID, HALL_RIGHT_BOT],
  35: [HALL_TOP, HALL_RIGHT_TOP, HALL_RIGHT_MID, HALL_RIGHT_BOT],
};

const AVATAR_COLORS = ["#22c55e", "#6366f1", "#3b82f6", "#a855f7", "#06b6d4", "#f97316", "#ec4899", "#eab308"];

export default function RealisticOfficeView() {
  const agents = useOfficeStore((s) => s.agents);
  const reducedMotion = useRef(false);
  const [spritesReady, setSpritesReady] = useState(assetsLoaded);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Load character sprite assets on mount
  useEffect(() => {
    if (!assetsLoaded) {
      ensureAssetsLoaded().then(() => setSpritesReady(true));
    }
  }, []);

  const agentNodes = useMemo(() => {
    const list = Array.from(agents.values())
      .filter(a => !a.isExternal && !a.agentId.startsWith("reviewer-"));

    // Use mock agents to fill remaining desks (for testing walk animation)
    const MOCK_AGENTS = [
      { id: "mock-0", name: "Alpha", status: "working", palette: 0 },
      { id: "mock-1", name: "Nova", status: "idle", palette: 1 },
      { id: "mock-2", name: "Cipher", status: "working", palette: 2 },
      { id: "mock-3", name: "Omega", status: "working", palette: 3 },
      { id: "mock-4", name: "Rex", status: "idle", palette: 4 },
      { id: "mock-5", name: "Luna", status: "working", palette: 5 },
      { id: "mock-6", name: "Kai", status: "working", palette: 6 },
      { id: "mock-7", name: "Zoe", status: "idle", palette: 0 },
    ];

    // Real agents first
    const realNodes = list.map((agent, i) => {
      const desk = DESK_POSITIONS[i % DESK_POSITIONS.length];
      const color = AVATAR_COLORS[agent.palette ?? (i % AVATAR_COLORS.length)];
      return {
        id: agent.agentId,
        name: agent.name,
        desk,
        deskIdx: i % DESK_POSITIONS.length,
        color,
        status: agent.status,
        isWorking: agent.status === "working",
        palette: agent.palette ?? (i % AVATAR_COLORS.length),
      };
    });

    // Fill remaining spots with mocks (up to 8 total)
    const mockNodes = MOCK_AGENTS.slice(list.length).map((agent, i) => {
      const idx = list.length + i;
      const desk = DESK_POSITIONS[idx % DESK_POSITIONS.length];
      const color = AVATAR_COLORS[agent.palette % AVATAR_COLORS.length];
      return {
        id: agent.id,
        name: agent.name,
        desk,
        deskIdx: idx % DESK_POSITIONS.length,
        color,
        status: agent.status,
        isWorking: agent.status === "working",
        palette: agent.palette,
      };
    });

    return [...realNodes, ...mockNodes];
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
      <div style={{ position: "relative", width: "100%", paddingBottom: "58%" }}>
        <div style={{ position: "absolute", inset: 0 }}>

      {/* Background — cover from top, trims dark floor */}
      <img
        src="/offices/realistic-office.png"
        alt="Office"
        draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "106%", objectFit: "cover", objectPosition: "center", display: "block" }}
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
          path={ZONE_PATHS[agent.deskIdx] ?? []}
          color={agent.color}
          name={agent.name}
          isWorking={agent.isWorking}
          status={agent.status}
          delay={i * 0.8}
          noAnimation={reducedMotion.current}
          palette={agent.palette}
          spritesReady={spritesReady}
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

// ─── Agent Sprite (uses PixiJS pixel character + waypoint walking) ───
function AgentSprite({ desk, path, color, name, isWorking, status, delay, noAnimation, palette, spritesReady }: {
  desk: { x: number; y: number }; path: Array<{ x: number; y: number }>;
  color: string; name: string;
  isWorking: boolean; status: string; delay: number; noAnimation: boolean; palette: number; spritesReady: boolean;
}) {
  // Full path: entrance → waypoints → desk
  const fullPath = [ENTRANCE, ...path, desk];
  const [step, setStep] = useState(noAnimation ? fullPath.length - 1 : 0);
  const [hovered, setHovered] = useState(false);

  // Walk through waypoints one by one
  useEffect(() => {
    if (noAnimation) { setStep(fullPath.length - 1); return; }
    let current = 0;
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        current++;
        if (current >= fullPath.length - 1) {
          setStep(fullPath.length - 1);
          clearInterval(interval);
        } else {
          setStep(current);
        }
      }, 600); // 600ms per waypoint segment
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(startDelay);
  }, [noAnimation, delay, fullPath.length]);

  const pos = fullPath[step] ?? desk;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: `${pos.x}%`, top: `${pos.y}%`,
        transform: "translate(-50%, -100%)",
        transition: noAnimation ? "none" : "left 0.6s linear, top 0.6s linear",
        cursor: "pointer", zIndex: 10,
      }}
    >
      {/* Character sprite — realistic or pixel depending on palette */}
      <div style={{
        filter: isWorking ? `drop-shadow(0 0 4px ${color})` : "none",
        animation: isWorking ? "agent-bob 1.5s ease-in-out infinite" : "none",
        opacity: status === "error" ? 0.4 : 1,
      }}>
        {REALISTIC_SPRITES[palette] ? (
          <RealisticAvatar
            src={REALISTIC_SPRITES[palette]}
            direction={0}
            walking={step < fullPath.length - 1}
            size={48}
          />
        ) : (
          <SpriteAvatar palette={palette} zoom={2} ready={spritesReady} />
        )}
      </div>

      {/* Status dot under character */}
      <div style={{
        position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
        width: 6, height: 6, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }} />

      {/* Name tooltip */}
      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
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
