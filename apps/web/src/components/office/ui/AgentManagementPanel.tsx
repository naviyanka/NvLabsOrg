"use client";

import { useState, useEffect, useCallback } from "react";
import { sendCommand } from "@/lib/connection";
import { useOfficeStore } from "@/store/office-store";
import TermModal from "./primitives/TermModal";
import TermButton from "./primitives/TermButton";
import TermInput from "./primitives/TermInput";

// Tab components (lazy loaded placeholders — will be implemented in later phases)
function PerformanceTab({ agentId, details }: { agentId: string; details: any }) {
  const agent = useOfficeStore((s) => s.agents.get(agentId));
  const metrics = details?.metrics;
  if (!metrics) return <div className="text-center text-muted-foreground py-8 text-[11px]">No performance data yet</div>;

  const totalTokens = metrics.totalInputTokens + metrics.totalOutputTokens;
  const successRate = metrics.taskCount > 0 ? Math.round((metrics.successCount / metrics.taskCount) * 100) : 0;

  return (
    <div className="space-y-3 text-[11px] font-mono">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Tasks" value={metrics.taskCount} />
        <StatCard label="Success Rate" value={`${successRate}%`} color={successRate >= 80 ? "#4ade80" : successRate >= 50 ? "#fbbf24" : "#f87171"} />
        <StatCard label="Input Tokens" value={formatTokens(metrics.totalInputTokens)} />
        <StatCard label="Output Tokens" value={formatTokens(metrics.totalOutputTokens)} />
        <StatCard label="Total Tokens" value={formatTokens(totalTokens)} />
        <StatCard label="Avg Duration" value={metrics.taskCount > 0 ? `${Math.round(metrics.totalDurationMs / metrics.taskCount / 1000)}s` : "—"} />
      </div>
      {metrics.lastTaskAt > 0 && (
        <div className="text-[10px] text-muted-foreground">
          Last task: {new Date(metrics.lastTaskAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function SkillsTab({ agentId, details }: { agentId: string; details: any }) {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const availableSkills = useOfficeStore((s) => s.availableSkills);
  const agentDefs = useOfficeStore((s) => s.agentDefs);

  // Find the agent def to get its ID for attach/detach
  const agent = useOfficeStore((s) => s.agents.get(agentId));
  const agentDef = agentDefs.find(d => d.name === (agent?.name ?? details?.name));
  const agentDefId = agentDef?.id ?? "";

  const attachedSkills: Array<{ name: string; title: string; content: string }> = details?.skills ?? [];
  const attachedNames = new Set((details?.skillFiles ?? []) as string[]);

  // Skills available but not yet attached
  const unattachedSkills = availableSkills.filter(s => !attachedNames.has(s.name));

  // Fetch available skills list
  useEffect(() => {
    sendCommand({ type: "LIST_SKILLS" });
  }, []);

  const handleAttach = (skillName: string) => {
    if (!agentDefId) return;
    sendCommand({ type: "ATTACH_SKILL", agentDefId, skillName });
    // Refresh details
    setTimeout(() => sendCommand({ type: "GET_AGENT_DETAILS", agentId }), 200);
  };

  const handleDetach = (skillName: string) => {
    if (!agentDefId) return;
    sendCommand({ type: "DETACH_SKILL", agentDefId, skillName });
    setTimeout(() => sendCommand({ type: "GET_AGENT_DETAILS", agentId }), 200);
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.txt";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const name = file.name.replace(/\.(md|txt)$/, "").replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
        sendCommand({ type: "SAVE_SKILL", name, content });
        // Auto-attach to this agent
        if (agentDefId) {
          setTimeout(() => {
            sendCommand({ type: "ATTACH_SKILL", agentDefId, skillName: name });
            sendCommand({ type: "GET_AGENT_DETAILS", agentId });
          }, 300);
        }
        setUploading(false);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-3 text-[11px]">
      {/* Attached skills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Attached Skills ({attachedSkills.length})
          </span>
          <TermButton variant="dim" size="sm" onClick={handleUpload} disabled={uploading}>
            {uploading ? "..." : "Upload .md"}
          </TermButton>
        </div>

        {attachedSkills.length === 0 && (
          <div className="text-muted-foreground opacity-50 text-center py-4">No skills attached</div>
        )}

        <div className="space-y-1">
          {attachedSkills.map((skill) => (
            <div key={skill.name} className="border border-[rgba(255,255,255,0.06)] rounded bg-black/10">
              <div
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/[0.03]"
                onClick={() => setExpandedSkill(expandedSkill === skill.name ? null : skill.name)}
              >
                <span className="text-[10px] text-muted-foreground">{expandedSkill === skill.name ? "▾" : "▸"}</span>
                <span className="text-[10px] text-accent font-mono flex-1">{skill.name}</span>
                <span className="text-[9px] text-muted-foreground opacity-60">{skill.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDetach(skill.name); }}
                  className="text-[9px] text-muted-foreground hover:text-[#f87171] px-1 transition-colors"
                  title="Detach skill"
                >✕</button>
              </div>
              {expandedSkill === skill.name && (
                <div className="px-2 pb-2">
                  <pre className="text-[9px] text-muted-foreground bg-black/20 rounded p-2 border border-[rgba(255,255,255,0.04)] whitespace-pre-wrap max-h-[150px] overflow-y-auto leading-relaxed">
                    {skill.content.slice(0, 2000)}{skill.content.length > 2000 ? "\n..." : ""}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Available skills to attach */}
      {unattachedSkills.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Available Skills
          </div>
          <div className="flex flex-wrap gap-1">
            {unattachedSkills.map((skill) => (
              <button
                key={skill.name}
                onClick={() => handleAttach(skill.name)}
                className="text-[9px] px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors font-mono"
                title={`Attach "${skill.title}" to this agent`}
              >
                + {skill.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryTab({ agentId }: { agentId: string }) {
  const [memoryData, setMemoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sendCommand({ type: "GET_AGENT_MEMORY", agentId });
  }, [agentId]);

  // Listen for AGENT_MEMORY_LOADED
  useEffect(() => {
    const originalHandleEvent = useOfficeStore.getState().handleEvent;
    const patchedHandler = (event: any) => {
      if (event.type === "AGENT_MEMORY_LOADED" && event.agentId === agentId) {
        setMemoryData(event);
        setLoading(false);
      }
      originalHandleEvent(event);
    };
    useOfficeStore.setState({ handleEvent: patchedHandler });
    return () => { useOfficeStore.setState({ handleEvent: originalHandleEvent }); };
  }, [agentId]);

  if (loading) return <div className="text-center text-muted-foreground py-8 text-[11px]">Loading memory...</div>;
  if (!memoryData) return <div className="text-center text-muted-foreground py-8 text-[11px]">No memory data</div>;

  const { sessionHistory, agentFacts, sharedKnowledge } = memoryData;

  return (
    <div className="space-y-4 text-[11px]">
      {/* Session History (L1) */}
      <div>
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Session History ({sessionHistory.length})
        </div>
        {sessionHistory.length === 0 ? (
          <div className="text-muted-foreground opacity-50 pl-2">No sessions recorded</div>
        ) : (
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {sessionHistory.map((s: any, i: number) => (
              <div key={i} className="flex items-baseline gap-2 text-[10px] px-2 py-0.5">
                <span className={`shrink-0 ${s.success ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                  {s.success ? "✓" : "✕"}
                </span>
                <span className="text-muted-foreground flex-1 truncate">{s.summary}</span>
                {s.timestamp > 0 && (
                  <span className="text-[9px] text-muted-foreground opacity-50 shrink-0">
                    {new Date(s.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Facts (L2) */}
      <div>
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Learned Facts ({agentFacts.length})
        </div>
        {agentFacts.length === 0 ? (
          <div className="text-muted-foreground opacity-50 pl-2">No facts learned yet</div>
        ) : (
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {agentFacts.map((f: any, i: number) => (
              <div key={i} className="text-[10px] px-2 py-0.5 text-foreground border-l-2 border-accent/30 pl-2">
                {f.text}
                {f.confidence && <span className="text-[9px] text-muted-foreground ml-2">({Math.round(f.confidence * 100)}%)</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Knowledge (L3) */}
      <div>
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Shared Knowledge ({sharedKnowledge.length})
        </div>
        {sharedKnowledge.length === 0 ? (
          <div className="text-muted-foreground opacity-50 pl-2">No shared knowledge</div>
        ) : (
          <div className="space-y-1 max-h-[100px] overflow-y-auto">
            {sharedKnowledge.map((s: any, i: number) => (
              <div key={i} className="text-[10px] px-2 py-0.5 text-muted-foreground">
                <span className="text-foreground">{s.text}</span>
                {s.confirmedBy?.length > 0 && (
                  <span className="text-[9px] opacity-50 ml-2">({s.confirmedBy.length} agents)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <TermButton variant="dim" size="sm" onClick={() => {
          if (confirm("Clear all memory for this agent? Cannot be undone.")) {
            sendCommand({ type: "CLEAR_MEMORY" });
          }
        }}>Clear Memory</TermButton>
        <TermButton variant="dim" size="sm" onClick={() => {
          const blob = new Blob([JSON.stringify(memoryData, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${agentId}-memory.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}>Export JSON</TermButton>
      </div>
    </div>
  );
}

function HistoryTab({ agentId }: { agentId: string }) {
  const agent = useOfficeStore((s) => s.agents.get(agentId));
  const [filter, setFilter] = useState<"all" | "user" | "agent" | "system">("all");
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  const messages = agent?.messages ?? [];
  const filtered = filter === "all" ? messages : messages.filter(m => m.role === filter);

  return (
    <div className="space-y-2 text-[11px]">
      {/* Filter bar */}
      <div className="flex gap-1 mb-2">
        {(["all", "user", "agent", "system"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[9px] px-2 py-0.5 rounded font-mono transition-colors ${
              filter === f ? "bg-accent/15 text-accent border border-accent/30" : "text-muted-foreground hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            {f} ({f === "all" ? messages.length : messages.filter(m => m.role === f).length})
          </button>
        ))}
      </div>

      {/* Messages */}
      {filtered.length === 0 && (
        <div className="text-muted-foreground opacity-50 text-center py-6">No messages yet</div>
      )}

      <div className="space-y-1 max-h-[280px] overflow-y-auto" data-scrollbar>
        {filtered.map((msg) => {
          const isExpanded = expandedMsg === msg.id;
          const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const date = new Date(msg.timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
          const roleColor = msg.role === "user" ? "#3b82f6" : msg.role === "agent" ? "#4ade80" : "#94a3b8";
          const preview = msg.text.slice(0, 80).replace(/\n/g, " ");

          return (
            <div key={msg.id} className="border border-[rgba(255,255,255,0.04)] rounded bg-black/10">
              <div
                className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-white/[0.02]"
                onClick={() => setExpandedMsg(isExpanded ? null : msg.id)}
              >
                <span className="text-[9px] w-3 shrink-0" style={{ color: roleColor }}>
                  {msg.role === "user" ? "▶" : msg.role === "agent" ? "◆" : "○"}
                </span>
                <span className="text-[9px] text-muted-foreground shrink-0 w-14">{date} {time}</span>
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{preview || "(empty)"}</span>
                {msg.result && <span className="text-[9px] text-[#4ade80] shrink-0">✓</span>}
                <span className="text-[9px] text-muted-foreground opacity-40">{isExpanded ? "▾" : "▸"}</span>
              </div>
              {isExpanded && (
                <div className="px-2 pb-2 border-t border-[rgba(255,255,255,0.04)]">
                  <pre className="text-[9px] text-foreground whitespace-pre-wrap leading-relaxed mt-1 max-h-[150px] overflow-y-auto">
                    {msg.text || "(no text)"}
                  </pre>
                  {msg.result && (
                    <div className="mt-1 text-[9px] text-muted-foreground border-t border-[rgba(255,255,255,0.04)] pt-1">
                      <span className="text-[#4ade80]">Result:</span> {msg.result.summary?.slice(0, 200) ?? "completed"}
                      {msg.result.changedFiles?.length > 0 && (
                        <div className="mt-0.5 opacity-60">{msg.result.changedFiles.length} file(s) changed</div>
                      )}
                    </div>
                  )}
                  {msg.durationMs && (
                    <div className="text-[9px] text-muted-foreground opacity-50 mt-0.5">
                      Duration: {(msg.durationMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───

interface AgentManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export default function AgentManagementPanel({ isOpen, onClose, agentId }: AgentManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "performance" | "skills" | "memory" | "history">("profile");
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const agent = useOfficeStore((s) => s.agents.get(agentId));

  // Fetch agent details when panel opens
  useEffect(() => {
    if (isOpen && agentId) {
      setLoading(true);
      sendCommand({ type: "GET_AGENT_DETAILS", agentId });
    }
  }, [isOpen, agentId]);

  // Listen for AGENT_DETAILS_LOADED
  useEffect(() => {
    if (!isOpen) return;
    const unsub = useOfficeStore.subscribe((state) => {
      // We'll patch the store to handle this event; for now use a custom event
    });
    return unsub;
  }, [isOpen]);

  // Custom event listener for details (since store might not handle it yet)
  useEffect(() => {
    if (!isOpen) return;
    const originalHandleEvent = useOfficeStore.getState().handleEvent;
    const patchedHandler = (event: any) => {
      if (event.type === "AGENT_DETAILS_LOADED" && event.agentId === agentId) {
        setDetails(event);
        setLoading(false);
      }
      originalHandleEvent(event);
    };
    useOfficeStore.setState({ handleEvent: patchedHandler });
    return () => {
      useOfficeStore.setState({ handleEvent: originalHandleEvent });
    };
  }, [isOpen, agentId]);

  const tabs = [
    { id: "profile" as const, label: "Profile" },
    { id: "performance" as const, label: "Performance" },
    { id: "skills" as const, label: "Skills" },
    { id: "memory" as const, label: "Memory" },
    { id: "history" as const, label: "History" },
  ];

  return (
    <TermModal open={isOpen} onClose={onClose} maxWidth={600} zIndex={110} title={`Agent: ${agent?.name ?? details?.name ?? "..."}`}>
      {/* Tab bar */}
      <div className="flex gap-0.5 mb-3 border-b border-[rgba(255,255,255,0.06)] pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[10px] font-mono rounded-t transition-colors ${
              activeTab === tab.id
                ? "bg-accent/15 text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-[11px]">Loading...</div>
        )}

        {!loading && activeTab === "profile" && (
          <ProfileTab agentId={agentId} details={details} agent={agent} />
        )}
        {!loading && activeTab === "performance" && (
          <PerformanceTab agentId={agentId} details={details} />
        )}
        {!loading && activeTab === "skills" && (
          <SkillsTab agentId={agentId} details={details} />
        )}
        {!loading && activeTab === "memory" && (
          <MemoryTab agentId={agentId} />
        )}
        {!loading && activeTab === "history" && (
          <HistoryTab agentId={agentId} />
        )}
      </div>
    </TermModal>
  );
}

// ─── Profile Tab ───

function ProfileTab({ agentId, details, agent }: { agentId: string; details: any; agent: any }) {
  const name = details?.name ?? agent?.name ?? "";
  const role = details?.role ?? agent?.role ?? "";
  const backend = details?.backend ?? agent?.backend ?? "";
  const personality = details?.personality ?? "";
  const palette = details?.palette ?? agent?.palette ?? 0;
  const skillFiles = details?.skillFiles ?? [];

  return (
    <div className="space-y-3 text-[11px]">
      {/* Identity */}
      <div className="grid grid-cols-[80px_1fr] gap-y-2 gap-x-3 font-mono">
        <span className="text-muted-foreground text-right">Name</span>
        <span className="text-foreground">{name}</span>

        <span className="text-muted-foreground text-right">Role</span>
        <span className="text-foreground">{role}</span>

        <span className="text-muted-foreground text-right">Backend</span>
        <span className="text-foreground">{backend || "default"}</span>

        <span className="text-muted-foreground text-right">Palette</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: paletteColors[palette % paletteColors.length] }} />
          <span className="text-muted-foreground">#{palette}</span>
        </div>

        <span className="text-muted-foreground text-right">Agent ID</span>
        <span className="text-muted-foreground opacity-60 select-text">{agentId}</span>
      </div>

      {/* Personality */}
      {personality && (
        <div>
          <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">Personality</div>
          <div className="text-[10px] text-foreground bg-black/20 rounded p-2 border border-[rgba(255,255,255,0.04)] whitespace-pre-wrap leading-relaxed max-h-[100px] overflow-y-auto">
            {personality}
          </div>
        </div>
      )}

      {/* Skills summary */}
      {skillFiles.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">Skills ({skillFiles.length})</div>
          <div className="flex flex-wrap gap-1">
            {skillFiles.map((s: string) => (
              <span key={s} className="text-[9px] px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {agent && (
        <div className="grid grid-cols-[80px_1fr] gap-y-1 gap-x-3 font-mono border-t border-[rgba(255,255,255,0.06)] pt-2">
          <span className="text-muted-foreground text-right">Status</span>
          <span className={`${agent.status === "working" ? "text-accent" : agent.status === "error" ? "text-[#f87171]" : "text-muted-foreground"}`}>
            {agent.status}
          </span>

          {agent.tokenUsage && (agent.tokenUsage.inputTokens > 0) && (
            <>
              <span className="text-muted-foreground text-right">Session</span>
              <span className="text-muted-foreground">
                {formatTokens(agent.tokenUsage.inputTokens + agent.tokenUsage.outputTokens)} tokens
              </span>
            </>
          )}

          {agent.cwd && (
            <>
              <span className="text-muted-foreground text-right">WorkDir</span>
              <span className="text-muted-foreground opacity-60 truncate select-text">{agent.cwd}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="border border-[rgba(255,255,255,0.06)] rounded p-2 bg-black/10">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[14px] font-medium" style={{ color: color ?? "var(--foreground)" }}>{value}</div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const paletteColors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899", "#84cc16"];
