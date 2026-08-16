"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/office-store";
import { Users, ClipboardList, Zap, Flame, DollarSign } from "lucide-react";

export default function StatCards() {
  const agents = useOfficeStore((s) => s.agents);
  const metricsData = useOfficeStore((s) => s.metricsData);
  const agentDefs = useOfficeStore((s) => s.agentDefs);

  const stats = useMemo(() => {
    const agentList = Array.from(agents.values()).filter(a => !a.isExternal);
    const activeCount = agentList.length;
    const totalDefs = agentDefs.length;
    const workingCount = agentList.filter(a => a.status === "working").length;
    const totalInput = agentList.reduce((s, a) => s + (a.tokenUsage?.inputTokens ?? 0), 0);
    const totalOutput = agentList.reduce((s, a) => s + (a.tokenUsage?.outputTokens ?? 0), 0);
    const totalTokens = totalInput + totalOutput;
    const estCost = (totalInput / 1_000_000) * 3 + (totalOutput / 1_000_000) * 15;

    return [
      { label: "Active Agents", value: String(activeCount), sub: `/${totalDefs || 32}`, change: "+12%", changeUp: true, color: "#6366f1", Icon: Users },
      { label: "Active Tasks", value: String(workingCount), sub: `/${activeCount || 1}`, change: "+8%", changeUp: true, color: "#3b82f6", Icon: ClipboardList },
      { label: "Pipelines", value: "—", sub: "", change: "", changeUp: true, color: "#22c55e", Icon: Zap },
      { label: "Token Usage (24h)", value: formatTokens(totalTokens), sub: "", change: "+3%", changeUp: true, color: "#eab308", Icon: Flame },
      { label: "Est. Spend (24h)", value: `$${estCost.toFixed(2)}`, sub: "", change: "+7%", changeUp: estCost > 0, color: "#ef4444", Icon: DollarSign },
    ];
  }, [agents, agentDefs, metricsData]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
      {stats.map((stat) => (
        <div key={stat.label} className="v2-stat-card" style={{ "--stat-color": stat.color } as any}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "var(--v2-text-muted)" }}>{stat.label}</span>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
              color: stat.color,
            }}><stat.Icon size={14} /></span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{stat.value}</span>
            {stat.sub && <span style={{ fontSize: 13, color: "var(--v2-text-muted)" }}>{stat.sub}</span>}
          </div>
          {stat.change && (
            <div style={{ marginTop: 6, fontSize: 11, color: stat.changeUp ? "var(--v2-green)" : "var(--v2-red)" }}>
              {stat.changeUp ? "↑" : "↓"} {stat.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTokens(n: number): string {
  if (n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
