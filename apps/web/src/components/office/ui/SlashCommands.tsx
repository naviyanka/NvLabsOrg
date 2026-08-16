"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useOfficeStore } from "@/store/office-store";

export interface SlashCommand {
  command: string;
  description: string;
  category: string;
  argHint?: string;
}

/** Fallback commands used before gateway responds */
const FALLBACK_COMMANDS: SlashCommand[] = [
  { command: "/cancel", description: "Cancel the current task", category: "Agent" },
  { command: "/fire", description: "Fire this agent", category: "Agent" },
  { command: "/retry", description: "Retry the last failed task", category: "Agent" },
  { command: "/clear", description: "Clear chat messages", category: "Agent" },
  { command: "/project", description: "Set working directory", category: "Project", argHint: "<path>" },
  { command: "/git", description: "Show git status", category: "Project" },
  { command: "/diff", description: "Show last git diff", category: "Project" },
  { command: "/push", description: "Push current branch", category: "Project" },
  { command: "/pr", description: "Create a pull request", category: "Project", argHint: "<title>" },
  { command: "/broadcast", description: "Send message to all agents", category: "Multi-Agent", argHint: "<message>" },
  { command: "/hire", description: "Hire a new agent", category: "Multi-Agent", argHint: "<role>" },
  { command: "/hireteam", description: "Hire a full team", category: "Multi-Agent" },
  { command: "/export", description: "Export chat as markdown", category: "Tools" },
  { command: "/model", description: "Change AI model", category: "Tools", argHint: "<name>" },
  { command: "/pipeline", description: "Open pipeline builder", category: "Tools" },
  { command: "/settings", description: "Open settings", category: "Tools" },
  { command: "/help", description: "Show all commands", category: "Info" },
  { command: "/status", description: "Refresh agent status", category: "Info" },
  { command: "/metrics", description: "Open metrics panel", category: "Info" },
];

/**
 * Hook that manages slash command menu state.
 * Returns: { menuVisible, selectedIdx, filtered, handleKeyDown, selectCurrent, menuElement }
 */
export function useSlashMenu(prompt: string, onSelect: (cmd: SlashCommand) => void) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const storeCommands = useOfficeStore((s) => s.slashCommands);
  const commands: SlashCommand[] = storeCommands.length > 0 ? storeCommands : FALLBACK_COMMANDS;

  const menuVisible = prompt.startsWith("/") && !prompt.includes(" ") && prompt.length >= 1;
  const query = prompt.slice(1); // text after /

  const filtered = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      c => c.command.slice(1).startsWith(lower) || c.description.toLowerCase().includes(lower)
    );
  }, [query, commands]);

  // Reset selection when filter changes
  useEffect(() => { setSelectedIdx(0); }, [filtered.length, query]);

  /**
   * Call this from the textarea's onKeyDown.
   * Returns true if the event was consumed (caller should preventDefault + stop).
   */
  const handleKeyDown = (e: React.KeyboardEvent): boolean => {
    if (!menuVisible || filtered.length === 0) return false;

    if (e.key === "ArrowDown") {
      setSelectedIdx(prev => Math.min(prev + 1, filtered.length - 1));
      return true;
    }
    if (e.key === "ArrowUp") {
      setSelectedIdx(prev => Math.max(prev - 1, 0));
      return true;
    }
    if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
      onSelect(filtered[selectedIdx]);
      return true;
    }
    if (e.key === "Escape") {
      return true;
    }
    return false;
  };

  return { menuVisible, selectedIdx, filtered, handleKeyDown };
}

/**
 * SlashCommandMenu — renders the autocomplete popup.
 * Controlled entirely by the parent via useSlashMenu() hook.
 */
export function SlashCommandMenu({
  visible,
  filtered,
  selectedIdx,
  onSelect,
  onArrow,
}: {
  visible: boolean;
  filtered: SlashCommand[];
  selectedIdx: number;
  onSelect: (cmd: SlashCommand) => void;
  onArrow?: (direction: "up" | "down") => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Document-level listener for arrow navigation AND Enter/Tab selection (capture phase — fires first)
  useEffect(() => {
    if (!visible || filtered.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); onArrow?.("down"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); onArrow?.("up"); }
      else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onSelect(filtered[selectedIdx]);
      }
    };
    document.addEventListener("keydown", handler, true); // capture phase
    return () => document.removeEventListener("keydown", handler, true);
  }, [visible, filtered, selectedIdx, onArrow, onSelect]);

  // Scroll selected into view
  useEffect(() => {
    if (!menuRef.current) return;
    const el = menuRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  if (!visible || filtered.length === 0) return null;

  let lastCategory = "";

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        bottom: "100%",
        left: 0,
        right: 0,
        maxHeight: 240,
        overflowY: "auto",
        marginBottom: 4,
        backgroundColor: "var(--term-panel, #111113)",
        border: "1px solid var(--term-border, #27272a)",
        borderRadius: 8,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.4)",
        zIndex: 200,
        padding: "4px 0",
      }}
    >
      {filtered.map((cmd, idx) => {
        const showCategory = cmd.category !== lastCategory;
        lastCategory = cmd.category;
        return (
          <div key={`${cmd.category}-${cmd.command}`}>
            {showCategory && (
              <div style={{
                padding: "4px 12px 2px",
                fontSize: 9,
                fontFamily: "monospace",
                color: "rgba(148,163,184,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                {cmd.category}
              </div>
            )}
            <div
              data-idx={idx}
              onClick={() => onSelect(cmd)}
              style={{
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                backgroundColor: idx === selectedIdx ? "rgba(255,255,255,0.06)" : "transparent",
                transition: "background-color 0.1s",
              }}
            >
              <span style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: "var(--term-green, #3b82f6)",
                fontWeight: 500,
                minWidth: 90,
              }}>
                {cmd.command}
                {cmd.argHint && (
                  <span style={{ color: "rgba(148,163,184,0.4)", fontWeight: 400 }}> {cmd.argHint}</span>
                )}
              </span>
              <span style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.7)",
              }}>
                {cmd.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parse a slash command from input text.
 */
export function parseSlashCommand(input: string): { command: string; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { command: trimmed.toLowerCase(), args: "" };
  return { command: trimmed.slice(0, spaceIdx).toLowerCase(), args: trimmed.slice(spaceIdx + 1).trim() };
}
