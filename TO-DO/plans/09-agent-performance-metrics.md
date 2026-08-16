# Plan: Agent Performance Metrics

## Priority: High Impact
## Effort: Medium (3-4 days)
## Category: Team & Collaboration

---

## Problem

Users have no data-driven way to compare backends or agents. Which backend is faster? Which costs less? Which has fewer failures? Currently this is all anecdotal.

## Goal

Track and display per-agent metrics:
- Average task duration
- Success/failure rate
- Tokens per task (input + output)
- Total spend estimate
- Tasks completed count

## Current State

- Token usage is tracked per task (TOKEN_UPDATE events)
- Task completion/failure is tracked (TASK_DONE/TASK_FAILED)
- Duration is computed in the store (from message timestamps)
- No aggregation or historical tracking exists
- Memory system has L1 facts per agent but no numerical metrics

## Proposed Solution

- Add a `metrics` field to the memory store (per-agent counters)
- Update counters on each TASK_DONE and TASK_FAILED
- Create a MetricsPanel component showing:
  - Bar chart: tasks per agent
  - Avg duration per agent
  - Success rate per agent
  - Cost per agent (tokens × estimated price)
- Accessible from agent context menu or dashboard

## Files to Create/Modify

1. `packages/memory/src/metrics.ts` — new metrics store (JSON file)
2. `packages/orchestrator/src/agent-session.ts` — emit metrics on task complete
3. `apps/web/src/components/office/ui/MetricsPanel.tsx` — new component
4. `apps/web/src/app/office/page.tsx` — add metrics access point

## Micro-Phases

- [ ] Phase 1: Define metrics schema (per-agent: taskCount, successCount, failCount, totalTokens, totalDurationMs)
- [ ] Phase 2: Create metrics storage (JSON file in data dir)
- [ ] Phase 3: Update orchestrator to record metrics on task completion
- [ ] Phase 4: Add GET_METRICS command to serve data to frontend
- [ ] Phase 5: Create MetricsPanel with per-agent stats table
- [ ] Phase 6: Add cost estimation (configurable price per token)

## Acceptance Criteria

- Metrics accumulate across sessions (persisted to disk)
- Per-agent breakdown is visible in the UI
- Success rate and average duration are calculated
- Cost estimate uses configurable token pricing
- Metrics reset button available
