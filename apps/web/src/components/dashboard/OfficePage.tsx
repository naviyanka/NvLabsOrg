"use client";

import { useState } from "react";
import { Users, UserCheck, Clock, AlertTriangle, WifiOff, Move, ZoomIn } from "lucide-react";

/**
 * Office Page — V2 Dashboard
 * Shows the office floor plan with zones, agent sidebar, and agents at a glance.
 */

const ZONES = [
  { name: "Planning Zone", x: 5, y: 3, w: 22, h: 28, color: "#a855f7" },
  { name: "Development Zone", x: 30, y: 3, w: 25, h: 28, color: "#22c55e" },
  { name: "QA & Security Zone", x: 58, y: 3, w: 25, h: 28, color: "#f97316" },
  { name: "Data Zone", x: 5, y: 35, w: 22, h: 20, color: "#06b6d4" },
  { name: "Meeting Area", x: 30, y: 35, w: 25, h: 22, color: "#eab308" },
  { name: "Automation Zone", x: 58, y: 35, w: 25, h: 22, color: "#3b82f6" },
  { name: "Research Zone", x: 5, y: 60, w: 25, h: 22, color: "#ec4899" },
  { name: "Operations Zone", x: 33, y: 62, w: 22, h: 20, color: "#84cc16" },
  { name: "Support Zone", x: 58, y: 62, w: 25, h: 20, color: "#14b8a6" },
];

const MOCK_AGENTS = [
  { name: "Alpha", role: "Backend Developer Agent", backend: "Gemini 1.5 Pro", status: "working", zone: "Development Zone", cpu: 34, mem: 62, tokens: "128.4K", tasks: 28, uptime: "3h 42m", skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API", "Authentication", "JWT", "Redis"] },
  { name: "Nova", role: "Security Analyst", backend: "Claude 3.5 Sonnet", status: "idle", zone: "QA & Security Zone", cpu: 28, mem: 45, tokens: "89.2K", tasks: 15, uptime: "2h 18m", skills: ["Penetration Testing", "OWASP", "Burp Suite"] },
  { name: "Cipher", role: "Bug Bounty Hunter", backend: "GPT-4o", status: "review", zone: "Research Zone", cpu: 41, mem: 68, tokens: "201.3K", tasks: 42, uptime: "5h 10m", skills: ["Recon", "XSS", "SQLi", "Nuclei"] },
  { name: "Omega", role: "Research Specialist", backend: "Gemini 1.5 Pro", status: "working", zone: "Research Zone", cpu: 25, mem: 39, tokens: "56.7K", tasks: 9, uptime: "1h 05m", skills: ["ML", "Data Analysis", "Scrapy"] },
];

export default function OfficePage() {
  const [selectedAgent, setSelectedAgent] = useState(MOCK_AGENTS[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "metrics" | "logs">("overview");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>🏢</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Office</h1>
        </div>
        <p style={{ fontSize: 12, color: "var(--v2-text-muted)", margin: 0, paddingLeft: 30 }}>
          Visualize and monitor your AI workforce in real-time
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12, padding: "10px 16px", background: "var(--v2-card)", border: "1px solid var(--v2-card-border)", borderRadius: 8 }}>
        <StatPill icon={<Users size={13} />} value={32} label="Total Agents" />
        <StatPill icon={<UserCheck size={13} />} value={24} label="Active" color="#22c55e" />
        <StatPill icon={<Clock size={13} />} value={3} label="Idle" color="#6366f1" />
        <StatPill icon={<AlertTriangle size={13} />} value={2} label="Review" color="#eab308" />
        <StatPill icon={<WifiOff size={13} />} value={3} label="Offline" color="#64748b" />
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--v2-text-muted)" }}>
          <span>View</span>
          <select style={{ background: "var(--v2-bg)", border: "1px solid var(--v2-card-border)", borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "var(--v2-text)" }}>
            <option>Floor Plan</option>
            <option>Grid</option>
            <option>List</option>
          </select>
        </div>
      </div>

      {/* Main content: Floor Plan + Sidebar */}
      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
        {/* Floor Plan */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{
            flex: 1, borderRadius: 10, overflow: "hidden",
            background: "linear-gradient(180deg, #0c1020 0%, #0a0e18 100%)",
            border: "1px solid var(--v2-card-border)",
            position: "relative", minHeight: 320,
          }}>
            {/* Background grid */}
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
              <defs>
                <pattern id="officeGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#officeGrid)" />
            </svg>

            {/* Zones */}
            {ZONES.map(zone => (
              <div key={zone.name} style={{
                position: "absolute",
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                border: `1px solid ${zone.color}50`,
                borderRadius: 6,
                background: `${zone.color}06`,
              }}>
                {/* Zone label */}
                <div style={{
                  position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
                  padding: "2px 8px", borderRadius: 4,
                  background: `${zone.color}30`, border: `1px solid ${zone.color}50`,
                  fontSize: 8, fontWeight: 500, color: zone.color,
                  whiteSpace: "nowrap",
                }}>
                  {zone.name}
                </div>

                {/* Desk sprites (decorative) */}
                <div style={{ position: "absolute", inset: "20px 8px 8px", display: "flex", flexWrap: "wrap", gap: 4, alignContent: "flex-start", justifyContent: "center" }}>
                  {Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, i) => (
                    <Desk key={i} color={zone.color} hasAgent={i < 2} agentWorking={i === 0} />
                  ))}
                </div>
              </div>
            ))}

            {/* Controls overlay */}
            <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 6 }}>
              <button style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid var(--v2-card-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--v2-text-muted)", cursor: "pointer" }}>
                <span style={{ fontSize: 14 }}>+</span>
              </button>
              <button style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid var(--v2-card-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--v2-text-muted)", cursor: "pointer" }}>
                <ZoomIn size={12} />
              </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ position: "absolute", top: 0, right: 0, padding: "8px 12px", fontSize: 10, color: "var(--v2-text-dim)" }}>
              Office › Development Zone › <span style={{ color: "var(--v2-text)" }}>Alpha</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "10px 0", fontSize: 10, color: "var(--v2-text-muted)" }}>
            <LegendItem color="#22c55e" label="Working" />
            <LegendItem color="#6366f1" label="Idle" />
            <LegendItem color="#eab308" label="Review" />
            <LegendItem color="#64748b" label="Offline" />
            <div style={{ flex: 1 }} />
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Move size={10} /> Drag to pan • Scroll to zoom</span>
          </div>

          {/* Agents at a Glance */}
          <div style={{ background: "var(--v2-card)", border: "1px solid var(--v2-card-border)", borderRadius: 10, padding: 16 }}>
            <div className="v2-section-title" style={{ marginBottom: 12 }}>Agents at a Glance</div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {MOCK_AGENTS.map(agent => (
                <AgentGlanceCard key={agent.name} agent={agent} selected={selectedAgent.name === agent.name} onClick={() => setSelectedAgent(agent)} />
              ))}
              <div style={{
                minWidth: 100, padding: "12px 16px", borderRadius: 8,
                border: "1px dashed var(--v2-card-border)", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", textAlign: "center",
              }}>
                <span style={{ fontSize: 12, color: "var(--v2-accent)" }}>View All Agents</span>
                <span style={{ fontSize: 9, color: "var(--v2-text-dim)" }}>Manage and monitor all agents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar — Agent Details */}
        <div style={{ width: 260, flexShrink: 0, background: "var(--v2-card)", border: "1px solid var(--v2-card-border)", borderRadius: 10, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Agent header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #22c55e30, #22c55e10)", border: "1px solid #22c55e40", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{selectedAgent.name}</div>
              <div style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>{selectedAgent.role}</div>
              <div style={{ fontSize: 9, color: "var(--v2-green)" }}>● {selectedAgent.backend}</div>
            </div>
            <StatusBadge status={selectedAgent.status} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--v2-card-border)" }}>
            {(["overview", "tasks", "metrics", "logs"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "6px 10px", fontSize: 10, border: "none", background: "transparent", cursor: "pointer",
                color: activeTab === tab ? "var(--v2-text)" : "var(--v2-text-dim)",
                borderBottom: activeTab === tab ? "2px solid var(--v2-accent)" : "2px solid transparent",
                fontWeight: activeTab === tab ? 600 : 400, textTransform: "capitalize",
              }}>{tab === "tasks" ? `Tasks (3)` : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>

          {/* Current Task */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-text)", marginBottom: 6 }}>Current Task</div>
            <div style={{ fontSize: 12, color: "#fff", marginBottom: 8 }}>Implement user authentication</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div className="v2-progress" style={{ flex: 1 }}>
                <div className="v2-progress-bar" style={{ width: "75%", background: "var(--v2-green)" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-green)" }}>75%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 9, color: "var(--v2-text-dim)" }}>
              <span>Started 10:24 AM • Est. 25m remaining</span>
              <button style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--v2-card-border)", background: "transparent", color: "var(--v2-text)", cursor: "pointer" }}>View Task</button>
            </div>
          </div>

          {/* Performance */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-text)", marginBottom: 8 }}>Performance (Live)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <MiniStat label="CPU" value={`${selectedAgent.cpu}%`} />
              <MiniStat label="Memory" value={`${selectedAgent.mem}%`} />
              <MiniStat label="Tokens (24h)" value={selectedAgent.tokens} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
              <MiniStat label="Backend" value={selectedAgent.backend.split(" ")[0]} />
              <MiniStat label="Uptime" value={selectedAgent.uptime} />
              <MiniStat label="Completed Tasks" value={String(selectedAgent.tasks)} />
            </div>
          </div>

          {/* Skills */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-text)", marginBottom: 8 }}>Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {selectedAgent.skills.slice(0, 7).map(s => (
                <span key={s} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid var(--v2-card-border)", color: "var(--v2-text-muted)" }}>{s}</span>
              ))}
              {selectedAgent.skills.length > 7 && (
                <span style={{ fontSize: 9, padding: "2px 8px", color: "var(--v2-accent)" }}>+{selectedAgent.skills.length - 7} more</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-text)", marginBottom: 8 }}>Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <ActionBtn label="Send Message" icon="💬" />
              <ActionBtn label="Assign Task" icon="📋" />
              <ActionBtn label="View Memory" icon="🧠" />
              <ActionBtn label="Stop Agent" icon="⏹" danger />
            </div>
          </div>

          <button style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--v2-card-border)", background: "transparent", color: "var(--v2-text-muted)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>More Options</span>
            <span>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: color ?? "var(--v2-text-muted)" }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: color ?? "var(--v2-text)" }}>{value}</span>
      <span style={{ fontSize: 10, color: "var(--v2-text-muted)" }}>{label}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}60` }} />
      <span>{label}</span>
    </div>
  );
}

function Desk({ color, hasAgent, agentWorking }: { color: string; hasAgent: boolean; agentWorking: boolean }) {
  return (
    <div style={{ width: 28, height: 22, borderRadius: 3, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Monitor */}
      <div style={{ width: 12, height: 8, borderRadius: 1, background: hasAgent ? `${color}40` : "rgba(255,255,255,0.02)", border: `1px solid ${hasAgent ? color + "60" : "rgba(255,255,255,0.05)"}` }} />
      {/* Agent indicator */}
      {hasAgent && (
        <div style={{ position: "absolute", bottom: -3, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: agentWorking ? "#22c55e" : "#6366f1", boxShadow: `0 0 4px ${agentWorking ? "#22c55e" : "#6366f1"}` }} />
      )}
    </div>
  );
}

function AgentGlanceCard({ agent, selected, onClick }: { agent: typeof MOCK_AGENTS[0]; selected: boolean; onClick: () => void }) {
  const statusColor = agent.status === "working" ? "#22c55e" : agent.status === "review" ? "#eab308" : "#6366f1";
  return (
    <div onClick={onClick} style={{
      minWidth: 130, padding: "10px 12px", borderRadius: 8, cursor: "pointer",
      background: selected ? "rgba(99,102,241,0.08)" : "transparent",
      border: `1px solid ${selected ? "rgba(99,102,241,0.3)" : "var(--v2-card-border)"}`,
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${statusColor}20`, border: `1px solid ${statusColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: statusColor, fontWeight: 700 }}>
          {agent.name[0]}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{agent.name}</div>
          <div style={{ fontSize: 8, color: "var(--v2-text-muted)" }}>{agent.role.split(" ").slice(0, 2).join(" ")}</div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: "var(--v2-text-dim)", marginBottom: 4 }}>{agent.backend}</div>
      <div style={{ fontSize: 9, color: "var(--v2-text-dim)" }}>CPU {agent.cpu}% | MEM {agent.mem}%</div>
      {/* Mini activity bars */}
      <div style={{ display: "flex", gap: 1, marginTop: 6 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 3 + Math.random() * 8, borderRadius: 1, background: `${statusColor}${40 + Math.floor(Math.random() * 40)}` }} />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "working" ? "#22c55e" : status === "review" ? "#eab308" : status === "error" ? "#ef4444" : "#6366f1";
  return (
    <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 10, background: `${color}15`, border: `1px solid ${color}40`, color, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--v2-text-dim)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{value}</div>
    </div>
  );
}

function ActionBtn({ label, icon, danger }: { label: string; icon: string; danger?: boolean }) {
  return (
    <button style={{
      padding: "8px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer",
      border: `1px solid ${danger ? "rgba(239,68,68,0.3)" : "var(--v2-card-border)"}`,
      background: danger ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)",
      color: danger ? "#f87171" : "var(--v2-text)",
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <span>{icon}</span> {label}
    </button>
  );
}
