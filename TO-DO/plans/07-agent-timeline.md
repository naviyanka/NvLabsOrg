# Plan: Agent Timeline / Activity Feed

## Priority: High Impact
## Effort: Medium (3-4 days)
## Category: UI/UX Improvements

---

## Problem

Understanding what an agent did requires scrolling through a chat view of messages. For long tasks with many tool calls and file changes, this is overwhelming. Users want a high-level chronological view of actions.

## Goal

Create a timeline view per agent that shows a condensed chronological list of:
- Task started (with prompt)
- Tools used (file reads, writes, commands)
- Files changed
- Errors/retries
- Task completed (with summary + duration)

## Current State

- `LOG_APPEND` and `TOOL_ACTIVITY` events stream tool activity text
- Chat messages accumulate in agent state
- `agentLogLines` map shows the last activity per agent
- No structured timeline or action log exists in the store

## Proposed Solution

- Create an `AgentTimeline` component (alternative to chat view for an agent)
- Extract structured events from the message history + log events
- Display as a vertical timeline with icons (file icon, terminal icon, checkmark, X)
- Add a tab in the agent pane: "Chat" | "Timeline"
- Keep it lightweight — derive from existing data, no new server-side storage

## Files to Create/Modify

1. `apps/web/src/components/office/ui/AgentTimeline.tsx` — new component
2. `apps/web/src/components/office/ui/AgentPane.tsx` — add Chat/Timeline tab
3. `apps/web/src/components/office/ui/TimelineEntry.tsx` — individual timeline item

## Micro-Phases

- [ ] Phase 1: Define timeline entry types (task_start, tool_use, file_change, error, task_end)
- [ ] Phase 2: Create parser to extract timeline from agent messages + log events
- [ ] Phase 3: Create TimelineEntry component with icons and colors
- [ ] Phase 4: Create AgentTimeline container with vertical line
- [ ] Phase 5: Add Chat/Timeline tab toggle in AgentPane
- [ ] Phase 6: Test with real agent sessions

## Acceptance Criteria

- Timeline shows a clean, scannable list of what happened
- Each entry has: timestamp, icon, short description
- File changes are clickable (show filename)
- Works for both team and solo agents
- Doesn't require additional server data (derives from existing events)
