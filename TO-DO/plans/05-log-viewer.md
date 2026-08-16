# Plan: Gateway Log Viewer

## Priority: Quick Win
## Effort: Small (1-2 days)
## Category: Reliability & DevOps

---

## Problem

To see gateway logs, users must access the terminal or read files from `~/.nvlabs-org-dev/data/instances/port-9099/gateway.log`. There's no web-based log viewer.

## Goal

Add a log viewer panel in the web UI that shows the gateway log in real-time (tail -f style).

## Current State

- `installFileLogger()` in gateway tees all console output to `gateway.log`
- No mechanism to stream logs to the web UI
- The WS channel sends events but not raw log lines

## Proposed Solution

- Add a new event type `LOG_GATEWAY` for streaming gateway logs to the web
- Add a "View Logs" button in settings or bottom toolbar
- Create a `LogViewer` modal/panel component
- Gateway tails its own log file and broadcasts to subscribed clients
- Rate-limit: send at most 1 batch per second, max 100 lines per batch

## Alternative (Simpler): Read log on demand

- Add a `GET_LOGS` command that returns the last N lines of gateway.log
- No streaming — just a snapshot each time the panel opens or user clicks "Refresh"
- Much simpler to implement

## Files to Create/Modify

1. `packages/shared/src/commands.ts` — add GetLogsCommand
2. `packages/shared/src/events.ts` — add LogsLoadedEvent
3. `apps/gateway/src/index.ts` — handle GET_LOGS (read last 200 lines of gateway.log)
4. `apps/web/src/components/office/ui/LogViewer.tsx` — new component
5. `apps/web/src/components/office/ui/SettingsModal.tsx` — add "View Logs" button

## Micro-Phases

- [ ] Phase 1: Add GET_LOGS command and LogsLoadedEvent to shared types
- [ ] Phase 2: Implement GET_LOGS handler in gateway (read last 200 lines)
- [ ] Phase 3: Create LogViewer component (monospace scrollable panel)
- [ ] Phase 4: Add "View Logs" button to settings
- [ ] Phase 5: Add auto-refresh toggle (poll every 5s)

## Acceptance Criteria

- Users can view the last 200 lines of gateway log from the web UI
- Log viewer is a scrollable monospace panel
- Optional auto-refresh
- No performance impact when viewer is closed
