// ---------------------------------------------------------------------------
// Webhook Notifier — POSTs JSON payloads to configured webhook URLs
// on TASK_DONE and TASK_FAILED events. Includes optional HMAC-SHA256 signature.
// ---------------------------------------------------------------------------

import { createHmac } from "crypto";
import { config } from "./config.js";
import type { GatewayEvent } from "@office/shared";

interface WebhookPayload {
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Send webhook notifications for a gateway event.
 * Non-blocking — fires and forgets. Errors are logged but never throw.
 */
export function notifyWebhooks(event: GatewayEvent): void {
  const webhooks = config.webhooks;
  if (!webhooks || webhooks.length === 0) return;

  const eventType = event.type;

  for (const hook of webhooks) {
    if (!hook.enabled) continue;
    if (hook.events.length > 0 && !hook.events.includes(eventType)) continue;

    const payload = buildPayload(event);
    if (!payload) continue;

    sendWebhook(hook.url, payload, hook.secret).catch((err) => {
      console.error(`[Webhook] Failed to POST to ${hook.url}: ${err.message}`);
    });
  }
}

function buildPayload(event: GatewayEvent): WebhookPayload | null {
  const ts = Date.now();

  if (event.type === "TASK_DONE") {
    const e = event as any;
    return {
      event: "TASK_DONE",
      timestamp: ts,
      data: {
        agentId: e.agentId,
        taskId: e.taskId,
        summary: e.result?.summary?.slice(0, 500) ?? "Done",
        changedFiles: e.result?.changedFiles ?? [],
        tokenUsage: e.result?.tokenUsage ?? null,
        isFinalResult: e.isFinalResult ?? false,
      },
    };
  }

  if (event.type === "TASK_FAILED") {
    const e = event as any;
    return {
      event: "TASK_FAILED",
      timestamp: ts,
      data: {
        agentId: e.agentId,
        taskId: e.taskId,
        error: e.error?.slice(0, 500) ?? "Unknown error",
      },
    };
  }

  if (event.type === "AGENT_CREATED") {
    const e = event as any;
    return {
      event: "AGENT_CREATED",
      timestamp: ts,
      data: {
        agentId: e.agentId,
        name: e.name,
        role: e.role,
        backend: e.backend,
      },
    };
  }

  if (event.type === "AGENT_FIRED") {
    const e = event as any;
    return {
      event: "AGENT_FIRED",
      timestamp: ts,
      data: { agentId: e.agentId },
    };
  }

  return null;
}

async function sendWebhook(url: string, payload: WebhookPayload, secret?: string): Promise<void> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "NVLabs-Org-Gateway/1.0",
  };

  if (secret) {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${sig}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[Webhook] ${url} responded ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
