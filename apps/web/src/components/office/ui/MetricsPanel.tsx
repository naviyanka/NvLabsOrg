"use client";

import { useState, useEffect, useCallback } from "react";
import { sendCommand } from "@/lib/connection";
import { useOfficeStore } from "@/store/office-store";
import TermModal from "./primitives/TermModal";
import TermButton from "./primitives/TermButton";

interface MetricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MetricsPanel({ isOpen, onClose }: MetricsPanelProps) {
  const metricsData = useOfficeStore((s) => s.metricsData);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(() => {
    setLoading(true);
    sendCommand({ type: "GET_METRICS" });
  }, []);

  useEffect(() => {
    if (metricsData) setLoading(false);
  }, [metricsData]);

  useEffect(() => {
    if (isOpen) fetchMetrics();
  }, [isOpen, fetchMetrics]);

  const agents = metricsData ? Object.values(metricsData.agents) : [];
  const totalTasks = agents.reduce((s, a) => s + a.taskCount, 0);
  const totalTokens = agents.reduce((s, a) => s + a.totalInputTokens + a.totalOutputTokens, 0);

  return (
    <TermModal open={isOpen} onClose={onClose} maxWidth={600} zIndex={110} title="Agent Metrics">
      <div className="flex items-center gap-2 mb-3">
        <TermButton variant="dim" size="sm" onClick={fetchMetrics} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </TermButton>
        <TermButton
          variant="dim"
          size="sm"
          onClick={() => {
            if (confirm("Clear all metrics? This cannot be undone.")) {
              sendCommand({ type: "CLEAR_METRICS" });
            }
          }}
        >
          Clear
        </TermButton>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {totalTasks} tasks | {formatTokens(totalTokens)} tokens
        </span>
      </div>

      {agents.length === 0 ? (
        <div className="text-center text-muted-foreground text-[12px] py-8 opacity-60">
          No metrics recorded yet. Run some tasks to see data here.
        </div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: 350 }}>
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr className="text-muted-foreground border-b border-[rgba(255,255,255,0.08)]">
                <th className="text-left py-1.5 px-2">Agent</th>
                <th className="text-left py-1.5 px-2">Backend</th>
                <th className="text-right py-1.5 px-2">Tasks</th>
                <th className="text-right py-1.5 px-2">Success</th>
                <th className="text-right py-1.5 px-2">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {agents
                .sort((a, b) => b.taskCount - a.taskCount)
                .map((a) => {
                  const rate = a.taskCount > 0 ? Math.round((a.successCount / a.taskCount) * 100) : 0;
                  const rateColor = rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444";
                  return (
                    <tr key={a.agentId} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                      <td className="py-1.5 px-2 text-foreground">{a.agentName}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{a.backend}</td>
                      <td className="py-1.5 px-2 text-right text-foreground">{a.taskCount}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: rateColor }}>{rate}%</td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">{formatTokens(a.totalInputTokens + a.totalOutputTokens)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </TermModal>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
