"use client";

import { useMemo } from "react";
import type { ChatMessage } from "@/store/office-store";

// ---------------------------------------------------------------------------
// Timeline entry types
// ---------------------------------------------------------------------------

interface TimelineEntry {
  id: string;
  type: "task_start" | "tool_use" | "file_change" | "delegation" | "error" | "task_end";
  text: string;
  timestamp: number;
  icon: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Parser: extract timeline from agent messages
// ---------------------------------------------------------------------------

function parseTimeline(messages: ChatMessage[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const msg of messages) {
    const ts = msg.timestamp;

    if (msg.role === "user") {
      entries.push({
        id: `${msg.id}-start`,
        type: "task_start",
        text: msg.text.replace(/^📱\s*/, "").slice(0, 120),
        timestamp: ts,
        icon: "▶",
        color: "#3b82f6",
      });
      continue;
    }

    if (msg.role === "system") {
      // Delegation
      if (msg.text.startsWith("Delegated to ")) {
        entries.push({
          id: msg.id,
          type: "delegation",
          text: msg.text.slice(0, 120),
          timestamp: ts,
          icon: "→",
          color: "#a855f7",
        });
        continue;
      }
      // Error/cancellation
      if (msg.text.includes("error") || msg.text.includes("Error") || msg.text.includes("failed") || msg.text.includes("cancelled")) {
        entries.push({
          id: msg.id,
          type: "error",
          text: msg.text.slice(0, 120),
          timestamp: ts,
          icon: "✕",
          color: "#ef4444",
        });
        continue;
      }
      // Queue/retry — skip (noise)
      continue;
    }

    if (msg.role === "agent") {
      // Task completed with result
      if (msg.result) {
        const files = msg.result.changedFiles ?? [];
        // File changes
        if (files.length > 0) {
          entries.push({
            id: `${msg.id}-files`,
            type: "file_change",
            text: `${files.length} file${files.length > 1 ? "s" : ""} changed: ${files.slice(0, 3).join(", ")}${files.length > 3 ? "..." : ""}`,
            timestamp: ts,
            icon: "◉",
            color: "#22c55e",
          });
        }
        // Task end
        entries.push({
          id: `${msg.id}-end`,
          type: "task_end",
          text: (msg.result.summary ?? msg.text ?? "Done").slice(0, 120),
          timestamp: ts,
          icon: "✓",
          color: "#22c55e",
        });
        continue;
      }
      // Streaming message (no result yet) — skip, not finalized
      continue;
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Timeline UI
// ---------------------------------------------------------------------------

interface AgentTimelineProps {
  messages: ChatMessage[];
}

export default function AgentTimeline({ messages }: AgentTimelineProps) {
  const entries = useMemo(() => parseTimeline(messages), [messages]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-muted-foreground opacity-50">
        No activity yet
      </div>
    );
  }

  return (
    <div className="p-3 overflow-y-auto h-full font-mono text-[11px]">
      <div className="relative pl-5">
        {/* Vertical line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        {entries.map((entry, i) => (
          <div key={entry.id} className="relative mb-3 last:mb-0">
            {/* Dot on the line */}
            <div
              className="absolute left-[-13px] top-[5px] w-[9px] h-[9px] rounded-full border-2"
              style={{ borderColor: entry.color, background: i === entries.length - 1 ? entry.color : "transparent" }}
            />

            {/* Content */}
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground opacity-50 shrink-0 w-10 text-right text-[9px]">
                {formatTime(entry.timestamp)}
              </span>
              <span style={{ color: entry.color }} className="shrink-0 w-3 text-center">
                {entry.icon}
              </span>
              <span className="text-muted-foreground flex-1 leading-relaxed" style={{ wordBreak: "break-word" }}>
                {entry.text}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
