"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ContextMenuAction {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface AgentContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function AgentContextMenu({ x, y, actions, onClose }: AgentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position so it doesn't overflow viewport
  const [pos, setPos] = useState({ x, y });
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let newX = x;
    let newY = y;
    if (x + rect.width > window.innerWidth - 8) newX = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8) newY = window.innerHeight - rect.height - 8;
    if (newX < 4) newX = 4;
    if (newY < 4) newY = 4;
    setPos({ x: newX, y: newY });
  }, [x, y]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
      }}
      className="min-w-[160px] py-1 rounded-md border border-[rgba(255,255,255,0.1)] shadow-xl"
      style-bg="var(--term-panel)"
    >
      <div
        style={{ backgroundColor: "var(--term-panel, #111113)" }}
        className="rounded-md overflow-hidden"
      >
        {actions.map((action, i) => (
          <button
            key={i}
            disabled={action.disabled}
            onClick={() => { action.onClick(); onClose(); }}
            className={`w-full text-left px-3 py-1.5 text-[11px] font-mono flex items-center gap-2 transition-colors ${
              action.disabled
                ? "text-muted-foreground/40 cursor-not-allowed"
                : action.danger
                  ? "text-[#f87171] hover:bg-[rgba(239,68,68,0.1)]"
                  : "text-foreground hover:bg-white/[0.06]"
            }`}
          >
            {action.icon && <span className="text-[12px] w-4 text-center">{action.icon}</span>}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook for managing context menu state.
 * Returns: [contextMenu element | null, showMenu function]
 */
export function useAgentContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; actions: ContextMenuAction[] } | null>(null);

  const showMenu = useCallback((e: React.MouseEvent, actions: ContextMenuAction[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, actions });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  const element = menu ? (
    <AgentContextMenu x={menu.x} y={menu.y} actions={menu.actions} onClose={closeMenu} />
  ) : null;

  return [element, showMenu] as const;
}
