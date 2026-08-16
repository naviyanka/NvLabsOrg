# Plan: Smart Retry with Context

## Priority: Quick Win
## Effort: Small (1 day)
## Category: Agent Intelligence & Workflow

---

## Problem

When a task fails and is retried (either by the retry tracker or via /retry), it re-sends the exact same prompt. The agent has no knowledge of why the previous attempt failed, leading to identical failures.

## Goal

When retrying a failed task, inject the error message and failure context into the retry prompt so the agent can adapt its approach.

## Current State

- `RetryTracker` in `packages/orchestrator/src/retry.ts` tracks attempts and generates retry prompts
- The retry prompt is constructed in `getRetryPrompt()` method
- The agent session's `prependTask()` re-queues the task
- `/retry` in Telegram simply re-sends `last.prompt` verbatim

## Proposed Solution

- Modify `RetryTracker.getRetryPrompt()` to include the error message from the failed attempt
- Format: `"[RETRY — Previous attempt failed: {error}]\n\n{original_prompt}"`
- For Telegram `/retry`: append a note about the previous failure from `lastTaskResults`
- Don't modify the stored `prompt` field — only the dispatched text

## Files to Modify

1. `packages/orchestrator/src/retry.ts` — include error context in retry prompt
2. `apps/gateway/src/telegram-channel.ts` — enhance `/retry` to include failure context

## Micro-Phases

- [ ] Phase 1: Modify RetryTracker to store last error per taskId
- [ ] Phase 2: Include error context in getRetryPrompt() output
- [ ] Phase 3: Update Telegram /retry to include last failure reason
- [ ] Phase 4: Test with a deliberately failing task

## Acceptance Criteria

- Auto-retries include the error message from the previous attempt
- Manual /retry includes context about what went wrong
- Original prompt is preserved (not mutated)
- Error context is concise (truncated to 500 chars max)
