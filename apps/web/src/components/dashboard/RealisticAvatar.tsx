"use client";

import { useState, useEffect, useRef } from "react";

/**
 * RealisticAvatar — renders a frame from a realistic character spritesheet.
 * 
 * Expected spritesheet format:
 * - 768×512 total (or similar)
 * - 8 columns × 3 rows
 * - Row 0: facing front (idle/walk)
 * - Row 1: facing back
 * - Row 2: walking side
 * 
 * Each frame: 96×170 approximately (768/8 = 96, 512/3 ≈ 170)
 */

interface RealisticAvatarProps {
  /** Path to the spritesheet image */
  src: string;
  /** Which row to show: 0=front, 1=back, 2=side */
  direction?: 0 | 1 | 2;
  /** Whether to animate the walk cycle */
  walking?: boolean;
  /** Display size (height in px, width scales proportionally) */
  size?: number;
  /** Specific frame to show (0-7), overrides animation */
  frame?: number;
}

// Spritesheet layout
const COLS = 8;
const ROWS = 3;

export default function RealisticAvatar({ src, direction = 0, walking = false, size = 48, frame: fixedFrame }: RealisticAvatarProps) {
  const [frame, setFrame] = useState(fixedFrame ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Walk animation cycle
  useEffect(() => {
    if (fixedFrame !== undefined) { setFrame(fixedFrame); return; }
    if (!walking) { setFrame(0); return; }

    let f = 0;
    intervalRef.current = setInterval(() => {
      f = (f + 1) % COLS;
      setFrame(f);
    }, 120); // ~8fps walk cycle

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [walking, fixedFrame]);

  // Frame dimensions (percentage-based for background-position)
  const frameWidthPct = 100 / COLS;  // 12.5%
  const frameHeightPct = 100 / ROWS; // 33.33%
  const bgPosX = frame * frameWidthPct;
  const bgPosY = direction * frameHeightPct;

  // Aspect ratio of each frame (96:170 ≈ 0.565)
  const frameAspect = (768 / COLS) / (512 / ROWS);
  const width = size * frameAspect;

  return (
    <div
      style={{
        width,
        height: size,
        backgroundImage: `url(${src})`,
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
        backgroundRepeat: "no-repeat",
        imageRendering: "auto",
      }}
    />
  );
}
