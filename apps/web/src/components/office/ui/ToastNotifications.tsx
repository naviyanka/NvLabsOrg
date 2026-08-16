"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ToastType = "info" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // ms, default 4000
  createdAt: number;
}

let toastIdCounter = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let currentToasts: Toast[] = [];

function notify() {
  for (const fn of listeners) fn([...currentToasts]);
}

/** Show a toast notification. Can be called from anywhere (not just React). */
export function showToast(message: string, type: ToastType = "info", duration = 4000) {
  const id = `toast-${++toastIdCounter}`;
  const toast: Toast = { id, message, type, duration, createdAt: Date.now() };
  currentToasts = [...currentToasts, toast];
  notify();
  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
}

/** Dismiss a specific toast */
export function dismissToast(id: string) {
  currentToasts = currentToasts.filter(t => t.id !== id);
  notify();
}

// Convenience helpers
export const toast = {
  info: (msg: string, duration?: number) => showToast(msg, "info", duration),
  success: (msg: string, duration?: number) => showToast(msg, "success", duration),
  error: (msg: string, duration?: number) => showToast(msg, "error", duration ?? 6000),
  warning: (msg: string, duration?: number) => showToast(msg, "warning", duration ?? 5000),
};

// ---------------------------------------------------------------------------
// Toast Container Component — renders toasts in bottom-right corner
// ---------------------------------------------------------------------------

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  info: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)", icon: "ℹ️" },
  success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)", icon: "✓" },
  error: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", icon: "✕" },
  warning: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.3)", icon: "⚠" },
};

const TYPE_COLORS: Record<ToastType, string> = {
  info: "#60a5fa",
  success: "#4ade80",
  error: "#f87171",
  warning: "#fbbf24",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => { listeners.delete(setToasts); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 8,
        pointerEvents: "none",
        maxWidth: 360,
      }}
    >
      {toasts.slice(-5).map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const [exiting, setExiting] = useState(false);
  const style = TYPE_STYLES[t.type];
  const color = TYPE_COLORS[t.type];
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Animate exit
  useEffect(() => {
    const remaining = (t.duration ?? 4000) - (Date.now() - t.createdAt);
    if (remaining > 300) {
      timerRef.current = setTimeout(() => setExiting(true), remaining - 300);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [t]);

  return (
    <div
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 8,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "auto",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        animation: exiting ? "toast-exit 0.3s ease forwards" : "toast-enter 0.3s ease",
        cursor: "pointer",
      }}
      onClick={() => dismissToast(t.id)}
    >
      <span style={{ fontSize: 14, color, lineHeight: 1, flexShrink: 0 }}>
        {style.icon}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#e2e8f0",
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        {t.message}
      </span>
    </div>
  );
}
