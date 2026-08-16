# Plan: Webhook Notifications

## Priority: Quick Win
## Effort: Small (1-2 days)
## Category: Integrations & Extensibility

---

## Problem

Task completions and failures can only be seen in the web UI or Telegram. There's no way to notify external systems (Slack, Discord, CI/CD pipelines, custom tools).

## Goal

Add configurable webhook URLs that receive POST requests on key events (task done, task failed, agent created/fired).

## Current State

- No webhook system exists
- Events are broadcast through channels (WebSocket, Telegram)
- Config system supports arbitrary fields via SaveConfigCommand

## Proposed Solution

- Add `webhookUrls` field to SavedConfig (array of { url, events, secret })
- Create a `webhook-channel.ts` that implements the Channel interface
- On matching events, POST a JSON payload to each configured URL
- Include HMAC signature header for verification (using optional secret)
- Add webhook configuration in Settings UI

## Payload Format

```json
{
  "event": "TASK_DONE",
  "timestamp": 1234567890,
  "data": {
    "agentId": "agent-abc123",
    "agentName": "Rex",
    "summary": "Created login page",
    "changedFiles": ["src/login.tsx"],
    "tokenUsage": { "input": 5000, "output": 200 }
  }
}
```

## Files to Create/Modify

1. `apps/gateway/src/webhook-channel.ts` — new Channel implementation
2. `apps/gateway/src/config.ts` — add webhookUrls to SavedConfig
3. `apps/gateway/src/index.ts` — register webhook channel, handle SAVE_CONFIG for webhooks
4. `packages/shared/src/commands.ts` — add webhookUrls to SaveConfigCommand
5. `packages/shared/src/events.ts` — add webhookUrls to ConfigLoadedEvent
6. `apps/web/src/components/office/ui/SettingsModal.tsx` — webhook config UI

## Micro-Phases

- [ ] Phase 1: Define webhook config schema and add to SavedConfig
- [ ] Phase 2: Create webhook-channel.ts (Channel interface + HTTP POST)
- [ ] Phase 3: Register in gateway and wire to SAVE_CONFIG
- [ ] Phase 4: Add webhook settings UI (URL input, event checkboxes, test button)
- [ ] Phase 5: Add HMAC signature verification
- [ ] Phase 6: Test with a webhook.site endpoint

## Acceptance Criteria

- Configurable webhook URLs in settings
- POST sent on TASK_DONE, TASK_FAILED events
- Optional HMAC secret for security
- Graceful failure (timeouts, retries) — don't block the gateway
- Test button in UI to verify connectivity
