"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { sendCommand } from "@/lib/connection";
import { useOfficeStore } from "@/store/office-store";
import TermModal from "./primitives/TermModal";
import TermButton from "./primitives/TermButton";

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogViewer({ isOpen, onClose }: LogViewerProps) {
  const lines = useOfficeStore((s) => s.gatewayLogs);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    sendCommand({ type: "GET_LOGS", lines: 200 });
  }, []);

  // Clear loading when lines arrive
  useEffect(() => {
    if (lines.length > 0) {
      setLoading(false);
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [lines]);

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    } else {
      setAutoRefresh(false);
    }
  }, [isOpen, fetchLogs]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefresh && isOpen) {
      timerRef.current = setInterval(fetchLogs, 5000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, isOpen, fetchLogs]);

  return (
    <TermModal
      open={isOpen}
      onClose={onClose}
      maxWidth={700}
      zIndex={110}
      title="Gateway Logs"
    >
      <div className="flex items-center gap-2 mb-2">
        <TermButton variant="dim" size="sm" onClick={fetchLogs} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </TermButton>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Auto-refresh (5s)
        </label>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {lines.length} lines
        </span>
      </div>

      <div
        ref={scrollRef}
        className="bg-black/40 border border-[rgba(255,255,255,0.06)] rounded overflow-auto font-mono text-[11px] leading-[1.6] text-muted-foreground select-text"
        style={{ height: 400, padding: "8px 10px" }}
      >
        {lines.length === 0 && !loading && (
          <div className="text-center opacity-50 pt-10">No logs available</div>
        )}
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.includes("[ERROR]") || line.toLowerCase().includes("error")
                ? "text-[#ef4444]"
                : line.includes("[WARN]") || line.toLowerCase().includes("warn")
                ? "text-[#f59e0b]"
                : line.includes("GATEWAY_READY")
                ? "text-[#22c55e]"
                : ""
            }
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
          >
            {line}
          </div>
        ))}
      </div>
    </TermModal>
  );
}
