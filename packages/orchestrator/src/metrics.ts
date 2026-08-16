// ---------------------------------------------------------------------------
// Agent Performance Metrics — persisted counters per agent
// Tracks task count, success/failure rate, tokens, and duration.
// Stored as JSON at ~/.nvlabs-org[-dev]/data/metrics.json
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { homedir } from "os";

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  backend: string;
  taskCount: number;
  successCount: number;
  failCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalDurationMs: number;
  lastTaskAt: number;
}

export interface MetricsStore {
  agents: Record<string, AgentMetrics>;
  updatedAt: number;
}

const DATA_DIR = path.join(
  homedir(),
  process.env.NODE_ENV === "development" ? ".nvlabs-org-dev" : ".nvlabs-org",
  "data"
);
const METRICS_FILE = path.join(DATA_DIR, "metrics.json");

let cache: MetricsStore | null = null;

function load(): MetricsStore {
  if (cache) return cache;
  if (!existsSync(METRICS_FILE)) {
    cache = { agents: {}, updatedAt: Date.now() };
    return cache;
  }
  try {
    cache = JSON.parse(readFileSync(METRICS_FILE, "utf-8"));
    return cache!;
  } catch {
    cache = { agents: {}, updatedAt: Date.now() };
    return cache;
  }
}

function save(): void {
  if (!cache) return;
  cache.updatedAt = Date.now();
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(METRICS_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/**
 * Record a successful task completion.
 */
export function recordTaskSuccess(
  agentId: string,
  agentName: string,
  backend: string,
  durationMs: number,
  inputTokens: number,
  outputTokens: number,
): void {
  const store = load();
  const m = store.agents[agentId] ?? createEmpty(agentId, agentName, backend);
  m.agentName = agentName;
  m.backend = backend;
  m.taskCount++;
  m.successCount++;
  m.totalDurationMs += durationMs;
  m.totalInputTokens += inputTokens;
  m.totalOutputTokens += outputTokens;
  m.lastTaskAt = Date.now();
  store.agents[agentId] = m;
  save();
}

/**
 * Record a failed task.
 */
export function recordTaskFailure(
  agentId: string,
  agentName: string,
  backend: string,
): void {
  const store = load();
  const m = store.agents[agentId] ?? createEmpty(agentId, agentName, backend);
  m.agentName = agentName;
  m.backend = backend;
  m.taskCount++;
  m.failCount++;
  m.lastTaskAt = Date.now();
  store.agents[agentId] = m;
  save();
}

/**
 * Get all metrics for display.
 */
export function getAllMetrics(): MetricsStore {
  return load();
}

/**
 * Clear all metrics.
 */
export function clearMetrics(): void {
  cache = { agents: {}, updatedAt: Date.now() };
  save();
}

function createEmpty(agentId: string, agentName: string, backend: string): AgentMetrics {
  return {
    agentId,
    agentName,
    backend,
    taskCount: 0,
    successCount: 0,
    failCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalDurationMs: 0,
    lastTaskAt: 0,
  };
}
