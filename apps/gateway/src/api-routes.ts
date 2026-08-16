// ---------------------------------------------------------------------------
// REST API routes — mounted at /api/v1/ on the gateway HTTP server
// Provides programmatic access to agents, tasks, config, git, files, etc.
// Authentication: X-API-Key header must match config.apiKey
// ---------------------------------------------------------------------------

import type { IncomingMessage, ServerResponse } from "http";
import { config, saveConfig } from "./config.js";
import { nanoid } from "nanoid";
import { getAllMetrics, clearMetrics } from "@nvlabs-org/orchestrator";

// These are set by the gateway at startup
let orcRef: any = null;
let handleCommandRef: ((cmd: any, meta: any) => void) | null = null;

/**
 * Initialize API routes with references to the orchestrator and command handler.
 */
export function initApiRoutes(orc: any, handleCommand: (cmd: any, meta: any) => void) {
  orcRef = orc;
  handleCommandRef = handleCommand;
}

/** Dispatch a command through the gateway command handler */
function dispatch(cmd: any) {
  if (handleCommandRef) handleCommandRef(cmd, { role: "owner" as const, clientId: "api" });
}

/**
 * Handle an API request. Returns true if handled, false if not an API route.
 */
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url ?? "";
  if (!url.startsWith("/api/v1/")) return false;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return true; }

  // Auth check
  if (!authenticate(req, res)) return true;

  // Rate limit check
  if (!checkRateLimit(req, res)) return true;

  const fullPath = url.replace("/api/v1/", "").split("?")[0];
  const query = parseQuery(url);
  const method = req.method ?? "GET";

  try {
    // ─── Health ───
    if (fullPath === "health" && method === "GET") {
      json(res, 200, { status: "ok", version: "1.0", uptime: process.uptime() });
      return true;
    }

    // ─── Agents ───
    if (fullPath === "agents" && method === "GET") {
      const agents = orcRef?.getAllAgents() ?? [];
      json(res, 200, { agents });
      return true;
    }

    if (fullPath.match(/^agents\/[^/]+$/) && method === "GET") {
      const agentId = fullPath.replace("agents/", "");
      const agent = orcRef?.getAgent(agentId);
      if (!agent) { json(res, 404, { error: "Agent not found" }); return true; }
      json(res, 200, { agent });
      return true;
    }

    if (fullPath === "agents" && method === "POST") {
      const body = await readBody(req);
      const agentId = body.agentId || `agent-${nanoid(6)}`;
      dispatch({
        type: "CREATE_AGENT",
        agentId,
        name: body.name ?? "Agent",
        role: body.role ?? "Developer",
        backend: body.backend ?? config.defaultBackend,
        palette: body.palette ?? Math.floor(Math.random() * 8),
        personality: body.personality ?? "",
        workDir: body.workDir,
      });
      json(res, 201, { agentId, message: "Agent created" });
      return true;
    }

    if (fullPath.match(/^agents\/[^/]+$/) && method === "DELETE") {
      const agentId = fullPath.replace("agents/", "");
      dispatch({ type: "FIRE_AGENT", agentId });
      json(res, 200, { message: `Agent ${agentId} fired` });
      return true;
    }

    // ─── Teams ───
    if (fullPath === "teams" && method === "POST") {
      const body = await readBody(req);
      dispatch({
        type: "CREATE_TEAM",
        leadId: body.leadId,
        memberIds: body.memberIds ?? [],
        backends: body.backends,
        workDir: body.workDir,
      });
      json(res, 201, { message: "Team created" });
      return true;
    }

    if (fullPath === "teams" && method === "DELETE") {
      // Fire all team agents
      const agents = orcRef?.getAllAgents() ?? [];
      const teamAgents = agents.filter((a: any) => a.teamId);
      for (const a of teamAgents) {
        dispatch({ type: "FIRE_AGENT", agentId: a.agentId });
      }
      json(res, 200, { message: `Fired ${teamAgents.length} team agents` });
      return true;
    }

    // ─── Tasks ───
    if (fullPath === "tasks" && method === "POST") {
      const body = await readBody(req);
      const taskId = body.taskId || `task-${nanoid(8)}`;
      dispatch({
        type: "RUN_TASK",
        agentId: body.agentId,
        taskId,
        prompt: body.prompt,
        repoPath: body.repoPath,
      });
      json(res, 202, { taskId, message: "Task queued" });
      return true;
    }

    // ─── Pipelines ───
    if (fullPath === "pipelines" && method === "GET") {
      json(res, 200, { pipelines: config.pipelines ?? [] });
      return true;
    }

    if (fullPath === "pipelines/run" && method === "POST") {
      const body = await readBody(req);
      dispatch({
        type: "RUN_PIPELINE",
        name: body.name,
        input: body.input,
        workDir: body.workDir,
      });
      json(res, 202, { message: `Pipeline "${body.name}" started` });
      return true;
    }

    // ─── Metrics ───
    if (fullPath === "metrics" && method === "GET") {
      const metrics = getAllMetrics();
      json(res, 200, { metrics });
      return true;
    }

    if (fullPath === "metrics" && method === "DELETE") {
      clearMetrics();
      json(res, 200, { message: "Metrics cleared" });
      return true;
    }

    // ─── Git ───
    if (fullPath === "git/status" && method === "GET") {
      dispatch({ type: "GET_GIT_STATUS", path: query.path || config.defaultWorkspace });
      json(res, 202, { message: "Git status requested (see events)" });
      return true;
    }

    if (fullPath === "git/log" && method === "GET") {
      dispatch({
        type: "GET_GIT_LOG",
        path: query.path || config.defaultWorkspace,
        count: query.count ? parseInt(query.count, 10) : undefined,
      });
      json(res, 202, { message: "Git log requested (see events)" });
      return true;
    }

    if (fullPath === "git/push" && method === "POST") {
      const body = await readBody(req);
      dispatch({
        type: "PUSH_BRANCH",
        path: body.path || config.defaultWorkspace,
        branch: body.branch,
        remote: body.remote ?? config.githubRemote ?? "origin",
      });
      json(res, 202, { message: "Push initiated" });
      return true;
    }

    if (fullPath === "git/pr" && method === "POST") {
      const body = await readBody(req);
      dispatch({
        type: "CREATE_PR",
        path: body.path || config.defaultWorkspace,
        title: body.title,
        body: body.body,
        branch: body.branch,
        base: body.base,
      });
      json(res, 202, { message: "PR creation initiated" });
      return true;
    }

    // ─── Files ───
    if (fullPath === "files" && method === "GET") {
      dispatch({
        type: "LIST_FILES",
        path: query.path || config.defaultWorkspace,
        depth: query.depth ? parseInt(query.depth, 10) : 2,
      });
      json(res, 202, { message: "File list requested (see events)" });
      return true;
    }

    if (fullPath === "files/content" && method === "GET") {
      if (!query.path) { json(res, 400, { error: "path query parameter required" }); return true; }
      dispatch({ type: "READ_FILE", path: query.path });
      json(res, 202, { message: "File content requested (see events)" });
      return true;
    }

    // ─── Webhooks ───
    if (fullPath === "webhooks" && method === "GET") {
      json(res, 200, { webhooks: config.webhooks ?? [] });
      return true;
    }

    if (fullPath === "webhooks" && method === "POST") {
      const body = await readBody(req);
      const hooks = [...(config.webhooks ?? []), {
        url: body.url,
        secret: body.secret,
        events: body.events ?? ["TASK_DONE", "TASK_FAILED"],
        enabled: body.enabled !== false,
      }];
      dispatch({ type: "SAVE_CONFIG", webhooks: hooks });
      json(res, 201, { message: "Webhook added", total: hooks.length });
      return true;
    }

    if (fullPath.match(/^webhooks\/\d+$/) && method === "DELETE") {
      const index = parseInt(fullPath.replace("webhooks/", ""), 10);
      const hooks = [...(config.webhooks ?? [])];
      if (index < 0 || index >= hooks.length) {
        json(res, 404, { error: "Webhook index out of range" });
        return true;
      }
      hooks.splice(index, 1);
      dispatch({ type: "SAVE_CONFIG", webhooks: hooks });
      json(res, 200, { message: "Webhook removed", remaining: hooks.length });
      return true;
    }

    // ─── Config ───
    if (fullPath === "config" && method === "GET") {
      json(res, 200, {
        defaultBackend: config.defaultBackend,
        detectedBackends: config.detectedBackends,
        sandboxMode: config.sandboxMode,
        worktreeEnabled: config.worktreeEnabled,
        autoMergeEnabled: config.autoMergeEnabled,
        workspace: config.defaultWorkspace,
        githubRemote: config.githubRemote,
      });
      return true;
    }

    if (fullPath === "config" && method === "PATCH") {
      const body = await readBody(req);
      dispatch({ type: "SAVE_CONFIG", ...body });
      json(res, 200, { message: "Config updated" });
      return true;
    }

    // ─── Not found ───
    json(res, 404, { error: "Not found", availableEndpoints: [
      "GET  /api/v1/health",
      "GET  /api/v1/agents",
      "GET  /api/v1/agents/:id",
      "POST /api/v1/agents",
      "DELETE /api/v1/agents/:id",
      "POST /api/v1/teams",
      "DELETE /api/v1/teams",
      "POST /api/v1/tasks",
      "GET  /api/v1/pipelines",
      "POST /api/v1/pipelines/run",
      "GET  /api/v1/metrics",
      "DELETE /api/v1/metrics",
      "GET  /api/v1/git/status?path=",
      "GET  /api/v1/git/log?path=&count=",
      "POST /api/v1/git/push",
      "POST /api/v1/git/pr",
      "GET  /api/v1/files?path=&depth=",
      "GET  /api/v1/files/content?path=",
      "GET  /api/v1/webhooks",
      "POST /api/v1/webhooks",
      "DELETE /api/v1/webhooks/:index",
      "GET  /api/v1/config",
      "PATCH /api/v1/config",
    ] });
    return true;
  } catch (e) {
    json(res, 500, { error: (e as Error).message ?? "Internal error" });
    return true;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ─── Rate Limiter (sliding window per API key) ───
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 120; // requests per window

interface RateBucket {
  timestamps: number[];
}
const rateBuckets: Map<string, RateBucket> = new Map();

// Cleanup stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    bucket.timestamps = bucket.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (bucket.timestamps.length === 0) rateBuckets.delete(key);
  }
}, 300_000);

function checkRateLimit(req: IncomingMessage, res: ServerResponse): boolean {
  const key = (req.headers["x-api-key"] as string) || "anonymous";
  const now = Date.now();

  let bucket = rateBuckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    rateBuckets.set(key, bucket);
  }

  // Remove timestamps outside the window
  bucket.timestamps = bucket.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (bucket.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.timestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("X-RateLimit-Reset", String(Math.ceil((bucket.timestamps[0] + RATE_LIMIT_WINDOW_MS) / 1000)));
    json(res, 429, { error: "Rate limit exceeded. Try again later.", retryAfter });
    return false;
  }

  bucket.timestamps.push(now);
  // Add rate limit headers to response
  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
  res.setHeader("X-RateLimit-Remaining", String(RATE_LIMIT_MAX_REQUESTS - bucket.timestamps.length));
  return true;
}

function authenticate(req: IncomingMessage, res: ServerResponse): boolean {
  // If no API key configured, generate one on first access
  if (!config.apiKey) {
    const key = `nvl_${nanoid(32)}`;
    saveConfig({ apiKey: key });
    (config as any).apiKey = key;
    console.log(`[API] Generated API key: ${key}`);
  }

  const provided = req.headers["x-api-key"] as string | undefined;
  if (!provided || provided !== config.apiKey) {
    json(res, 401, { error: "Unauthorized. Provide X-API-Key header." });
    return false;
  }
  return true;
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseQuery(url: string): Record<string, string> {
  const qIdx = url.indexOf("?");
  if (qIdx === -1) return {};
  const params: Record<string, string> = {};
  const qs = url.slice(qIdx + 1);
  for (const pair of qs.split("&")) {
    const [k, v] = pair.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return params;
}

async function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}
