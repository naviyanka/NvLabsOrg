"use client";

import type { NavSection } from "@/app/v2/page";
import StatCards from "./StatCards";
import AgentNetworkCard from "./AgentNetworkCard";
import PipelineExecutionCard from "./PipelineExecutionCard";
import LiveActivityFeed from "./LiveActivityFeed";
import QuickActions from "./QuickActions";
import RecentTasks from "./RecentTasks";
import TopAgents from "./TopAgents";
import TokenCostChart from "./TokenCostChart";
import OfficePage from "./OfficePage";

interface DashboardContentProps {
  activeNav: NavSection;
}

export default function DashboardContent({ activeNav }: DashboardContentProps) {
  // Office page
  if (activeNav === "office") {
    return <main className="v2-main"><OfficePage /></main>;
  }

  // Default: Overview dashboard
  return (
    <main className="v2-main">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>✦</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>NVLabs Mission Control</h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--v2-text-muted)", margin: 0, paddingLeft: 30 }}>
          Monitor. Orchestrate. Scale.
        </p>
      </div>

      {/* Stat Cards */}
      <StatCards />

      {/* Three-column section: Agent Network | Pipeline Execution | Live Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: 16, marginBottom: 16 }}>
        <AgentNetworkCard />
        <PipelineExecutionCard />
        <LiveActivityFeed />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Two-column: Recent Tasks | Top Agents */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <RecentTasks />
        <TopAgents />
      </div>

      {/* Token & Cost Chart */}
      <TokenCostChart />

      {/* Ask NVLabs */}
      <div style={{
        marginTop: 16, padding: "12px 20px",
        background: "linear-gradient(135deg, var(--v2-accent), var(--v2-purple))",
        borderRadius: "var(--v2-radius)",
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer",
      }}>
        <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
          Ask NVLabs anything...
        </span>
        <kbd style={{ fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.15)", borderRadius: 4, color: "#fff" }}>Ctrl K</kbd>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#fff" }}>
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </div>
    </main>
  );
}
