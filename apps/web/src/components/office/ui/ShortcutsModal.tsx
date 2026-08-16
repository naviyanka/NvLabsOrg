"use client";

import TermModal from "./primitives/TermModal";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "General",
    items: [
      { keys: ["Cmd", "K"], desc: "Command palette" },
      { keys: ["?"], desc: "This shortcuts panel" },
      { keys: ["Esc"], desc: "Close modal / panel" },
    ],
  },
  {
    category: "Agents",
    items: [
      { keys: ["Enter"], desc: "Send message to selected agent" },
      { keys: ["Shift", "Enter"], desc: "New line in input" },
    ],
  },
  {
    category: "Navigation",
    items: [
      { keys: ["Cmd", "/"], desc: "Toggle shortcuts panel" },
      { keys: ["Cmd", ","], desc: "Open settings" },
    ],
  },
  {
    category: "Editor",
    items: [
      { keys: ["E"], desc: "Toggle edit mode (when not in input)" },
      { keys: ["G"], desc: "Toggle grid overlay" },
      { keys: ["Cmd", "Z"], desc: "Undo (editor)" },
      { keys: ["Cmd", "Shift", "Z"], desc: "Redo (editor)" },
      { keys: ["Delete"], desc: "Delete selected tile" },
    ],
  },
];

function Key({ children }: { children: string }) {
  return (
    <kbd
      style={{
        display: "inline-block",
        padding: "2px 6px",
        fontSize: "11px",
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: "1.4",
        color: "var(--foreground)",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "3px",
        minWidth: "20px",
        textAlign: "center",
      }}
    >
      {children}
    </kbd>
  );
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <TermModal open={isOpen} onClose={onClose} maxWidth={420} zIndex={120} title="Keyboard Shortcuts">
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {SHORTCUTS.map((section) => (
          <div key={section.category} className="mb-4">
            <div className="text-[12px] font-medium text-foreground mb-2 uppercase tracking-wider opacity-70">
              {section.category}
            </div>
            {section.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-1 text-[12px] text-muted-foreground font-mono"
              >
                <span>{item.desc}</span>
                <span className="flex items-center gap-1">
                  {item.keys.map((k, j) => (
                    <span key={j} className="flex items-center gap-0.5">
                      {j > 0 && <span className="text-[10px] opacity-40">+</span>}
                      <Key>{k}</Key>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-2 opacity-60 text-center">
        Cmd = Ctrl on Windows/Linux
      </div>
    </TermModal>
  );
}
