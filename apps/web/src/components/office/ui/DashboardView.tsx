"use client";

import { useMemo } from "react";
import { useOfficeStore, type AppNotification } from "@/store/office-store";
import { BACKEND_OPTIONS } from "./office-constants";
import TermButton from "./primitives/TermButton";
import { SessionCostSummary } from "./CostEstimator";

interface DashboardViewProps {
  onHire: () => void;
  onHireTeam: () => void;
  onSettings: () => void;
  onSelectAgent: (agentId: string) => void;
  onPipeline?: () => void;
}

function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-lg p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">{title}</div>
      {children}
    </div>
  );
}

export default function DashboardView({ onHire, onHireTeam, onSettings, onSelectAgent, onPipeline }: DashboardViewProps) {
  const agents = useOfficeStore((s) => s.agents);
  const notifications = useOfficeStore((s) => s.notifications);

  const agentList = useMemo(() => Array.from(agents.values()).filter(a => !a.isExternal && !a.agentId.startsWith("reviewer-")), [agents]);
  const totalInputTokens = agentList.reduce((s, a) => s + (a.tokenUsage?.inputTokens ?? 0), 0);
  const totalOutputTokens = agentList.reduce((s, a) => s + (a.tokenUsage?.outputTokens ?? 0), 0);
  const recentActivity = useMemo(() => [...notifications].reverse().slice(0, 5), [notifications]);

  return (
    <div className="p-4 overflow-y-auto h-full font-mono" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="text-[14px] text-foreground font-medium mb-4">Dashboard</div>

      {agentList.length === 0 ? (
        <DashboardCard title="Get Started">
          <div className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
            NVLabs Org is a multi-agent workspace. Hire AI agents, assign tasks, and watch them collaborate in real-time.
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <TermButton variant="primary" size="sm" onClick={onHire}>Hire Your First Agent</TermButton>
            <TermButton variant="dim" size="sm" onClick={onHireTeam}>Create a Full Team</TermButton>
            <TermButton variant="dim" size="sm" onClick={onSettings}>Configure Backends</TermButton>
          </div>
          <div className="text-[10px] text-muted-foreground opacity-60 mt-2">
            Press ? for keyboard shortcuts | Cmd+K for command palette
          </div>
        </DashboardCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <DashboardCard title="Team">
              <div className="space-y-1.5">
                {agentList.map((a) => {
                  const backendLabel = BACKEND_OPTIONS.find(b => b.id === a.backend)?.name ?? a.backend ?? "—";
                  const statusColor = a.status === "working" ? "#3b82f6" : a.status === "error" ? "#ef4444" : a.status === "done" ? "#22c55e" : "#666";
                  const statusIcon = a.status === "working" ? "🔄" : a.status === "error" ? "❌" : a.status === "done" ? "✅" : "💤";
                  return (
                    <div
                      key={a.agentId}
                      className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-white/[0.03] cursor-pointer transition-colors"
                      onClick={() => onSelectAgent(a.agentId)}
                    >
                      <span className="text-[12px]">{statusIcon}</span>
                      <span className="text-[11px] text-foreground flex-1 truncate">{a.name}</span>
                      <span className="text-[10px] text-muted-foreground">{backendLabel}</span>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                    </div>
                  );
                })}
              </div>
            </DashboardCard>

            <DashboardCard title="Token Usage">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-[18px] text-foreground font-medium">{formatTokens(totalInputTokens + totalOutputTokens)}</span>
                <span className="text-[10px] text-muted-foreground">total tokens</span>
                <SessionCostSummary />
              </div>
              <div className="space-y-1">
                {agentList
                  .filter(a => (a.tokenUsage?.inputTokens ?? 0) + (a.tokenUsage?.outputTokens ?? 0) > 0)
                  .sort((a, b) => ((b.tokenUsage?.inputTokens ?? 0) + (b.tokenUsage?.outputTokens ?? 0)) - ((a.tokenUsage?.inputTokens ?? 0) + (a.tokenUsage?.outputTokens ?? 0)))
                  .slice(0, 5)
                  .map((a) => {
                    const total = (a.tokenUsage?.inputTokens ?? 0) + (a.tokenUsage?.outputTokens ?? 0);
                    const pct = totalInputTokens + totalOutputTokens > 0 ? Math.round(total / (totalInputTokens + totalOutputTokens) * 100) : 0;
                    return (
                      <div key={a.agentId} className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground w-16 truncate">{a.name}</span>
                        <div className="flex-1 h-1.5 rounded bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <div className="h-full rounded bg-accent/60" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-muted-foreground w-12 text-right">{formatTokens(total)}</span>
                      </div>
                    );
                  })}
              </div>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DashboardCard title="Recent Activity">
              {recentActivity.length === 0 ? (
                <div className="text-[11px] text-muted-foreground opacity-60 py-3">No activity yet</div>
              ) : (
                <div className="space-y-1.5">
                  {recentActivity.map((n) => (
                    <ActivityItem key={n.id} notification={n} />
                  ))}
                </div>
              )}
            </DashboardCard>

            <DashboardCard title="Quick Actions">
              <div className="flex flex-wrap gap-2 py-1">
                <TermButton variant="dim" size="sm" onClick={onHire}>Hire Agent</TermButton>
                <TermButton variant="dim" size="sm" onClick={onHireTeam}>Hire Team</TermButton>
                {onPipeline && <TermButton variant="dim" size="sm" onClick={onPipeline}>Pipelines</TermButton>}
                <TermButton variant="dim" size="sm" onClick={onSettings}>Settings</TermButton>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 opacity-60">
                Cmd+K for command palette
              </div>
            </DashboardCard>
          </div>
        </>
      )}
    </div>
  );
}

function ActivityItem({ notification: n }: { notification: AppNotification }) {
  const icon = n.type === "task_done" ? "✅" : n.type === "task_failed" ? "❌" : n.type === "approval_needed" ? "🔐" : "➕";
  const timeAgo = formatTimeAgo(n.timestamp);
  return (
    <div className="flex items-start gap-2 text-[10px]">
      <span className="shrink-0">{icon}</span>
      <span className="text-muted-foreground flex-1 truncate">{n.title}</span>
      <span className="text-muted-foreground opacity-50 shrink-0">{timeAgo}</span>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h`;
  return `${Math.floor(diff / 86400_000)}d`;
}
