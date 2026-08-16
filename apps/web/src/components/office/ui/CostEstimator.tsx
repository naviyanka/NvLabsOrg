"use client";

import { useMemo } from "react";
import { useOfficeStore } from "@/store/office-store";

/**
 * Model pricing per 1M tokens (USD).
 * Updated periodically — these are approximate list prices.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-4-sonnet": { input: 3.0, output: 15.0 },
  "claude-3.5-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
  "claude-3-opus": { input: 15.0, output: 75.0 },
  // GPT
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "o1": { input: 15.0, output: 60.0 },
  "o1-mini": { input: 3.0, output: 12.0 },
  "o3-mini": { input: 1.1, output: 4.4 },
  // Gemini
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  // Open source / other
  "deepseek-coder": { input: 0.14, output: 0.28 },
  "deepseek-v3": { input: 0.27, output: 1.1 },
  "llama-3.1-70b": { input: 0.6, output: 0.6 },
  "codestral": { input: 0.3, output: 0.9 },
};

/** Backend-level fallback pricing (when model name isn't matched) */
const BACKEND_FALLBACK_PRICING: Record<string, { input: number; output: number }> = {
  claude: { input: 3.0, output: 15.0 },
  codex: { input: 2.5, output: 10.0 },
  gemini: { input: 1.25, output: 10.0 },
  kiro: { input: 3.0, output: 15.0 },
  aider: { input: 3.0, output: 15.0 },
  opencode: { input: 3.0, output: 15.0 },
};

/** Get pricing for a model name (fuzzy match) */
function getPricing(model?: string, backend?: string): { input: number; output: number } {
  if (model) {
    // Exact match
    if (MODEL_PRICING[model]) return MODEL_PRICING[model];
    // Fuzzy match — check if model contains a known key
    const lower = model.toLowerCase();
    for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
      if (lower.includes(key) || key.includes(lower)) return pricing;
    }
  }
  // Fallback to backend
  if (backend && BACKEND_FALLBACK_PRICING[backend]) return BACKEND_FALLBACK_PRICING[backend];
  // Default
  return { input: 3.0, output: 15.0 };
}

/** Format cost in a human-readable way */
function formatCost(usd: number): string {
  if (usd < 0.001) return "<$0.001";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Calculate estimated cost for an agent based on their average token usage per task.
 */
export function estimateTaskCost(agentId: string): {
  estimatedInput: number;
  estimatedOutput: number;
  estimatedCost: number;
  model?: string;
  backend?: string;
  confidence: "low" | "medium" | "high";
} | null {
  const state = useOfficeStore.getState();
  const metrics = state.metricsData;
  const agent = state.agents.get(agentId);

  if (!agent) return null;

  const agentMetrics = metrics?.agents?.[agentId];
  let avgInput = 15000; // default assumption: ~15k input tokens
  let avgOutput = 3000; // default assumption: ~3k output tokens
  let confidence: "low" | "medium" | "high" = "low";

  if (agentMetrics && agentMetrics.taskCount > 0) {
    avgInput = Math.round(agentMetrics.totalInputTokens / agentMetrics.taskCount);
    avgOutput = Math.round(agentMetrics.totalOutputTokens / agentMetrics.taskCount);
    confidence = agentMetrics.taskCount >= 5 ? "high" : agentMetrics.taskCount >= 2 ? "medium" : "low";
  } else if (agent.tokenUsage && (agent.tokenUsage.inputTokens > 0 || agent.tokenUsage.outputTokens > 0)) {
    // Use current session data as estimate
    avgInput = agent.tokenUsage.inputTokens || 15000;
    avgOutput = agent.tokenUsage.outputTokens || 3000;
    confidence = "low";
  }

  const pricing = getPricing(undefined, agent.backend);
  const inputCost = (avgInput / 1_000_000) * pricing.input;
  const outputCost = (avgOutput / 1_000_000) * pricing.output;

  return {
    estimatedInput: avgInput,
    estimatedOutput: avgOutput,
    estimatedCost: inputCost + outputCost,
    model: undefined,
    backend: agent.backend,
    confidence,
  };
}

/**
 * Inline cost badge — shows estimated cost for running a task with the current agent.
 */
export function CostBadge({ agentId }: { agentId: string }) {
  const agents = useOfficeStore((s) => s.agents);
  const metricsData = useOfficeStore((s) => s.metricsData);

  const estimate = useMemo(() => {
    const agent = agents.get(agentId);
    if (!agent) return null;

    const agentMetrics = metricsData?.agents?.[agentId];
    let avgInput = 15000;
    let avgOutput = 3000;
    let confidence: "low" | "medium" | "high" = "low";

    if (agentMetrics && agentMetrics.taskCount > 0) {
      avgInput = Math.round(agentMetrics.totalInputTokens / agentMetrics.taskCount);
      avgOutput = Math.round(agentMetrics.totalOutputTokens / agentMetrics.taskCount);
      confidence = agentMetrics.taskCount >= 5 ? "high" : agentMetrics.taskCount >= 2 ? "medium" : "low";
    }

    const pricing = getPricing(undefined, agent.backend);
    const cost = (avgInput / 1_000_000) * pricing.input + (avgOutput / 1_000_000) * pricing.output;

    return { cost, confidence, avgInput, avgOutput };
  }, [agentId, agents, metricsData]);

  if (!estimate) return null;

  const confidenceColor = estimate.confidence === "high" ? "#4ade80"
    : estimate.confidence === "medium" ? "#fbbf24" : "#94a3b8";

  return (
    <span
      title={`Est. cost: ${formatCost(estimate.cost)}\nAvg in: ${(estimate.avgInput / 1000).toFixed(1)}k tokens\nAvg out: ${(estimate.avgOutput / 1000).toFixed(1)}k tokens\nConfidence: ${estimate.confidence}`}
      style={{
        fontSize: 9,
        fontFamily: "monospace",
        color: confidenceColor,
        opacity: 0.7,
        padding: "1px 5px",
        border: `1px solid ${confidenceColor}30`,
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      ~{formatCost(estimate.cost)}
    </span>
  );
}

/**
 * Session cost summary — total spent across all agents in current session.
 */
export function SessionCostSummary() {
  const agents = useOfficeStore((s) => s.agents);

  const totalCost = useMemo(() => {
    let total = 0;
    for (const agent of agents.values()) {
      if (!agent.tokenUsage) continue;
      const pricing = getPricing(undefined, agent.backend);
      total += (agent.tokenUsage.inputTokens / 1_000_000) * pricing.input;
      total += (agent.tokenUsage.outputTokens / 1_000_000) * pricing.output;
    }
    return total;
  }, [agents]);

  if (totalCost === 0) return null;

  return (
    <span
      title={`Total session cost estimate (all agents)`}
      style={{
        fontSize: 9,
        fontFamily: "monospace",
        color: "#94a3b8",
        opacity: 0.6,
      }}
    >
      Session: ~{formatCost(totalCost)}
    </span>
  );
}
