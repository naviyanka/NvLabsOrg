# Plan: Git Integration Panel

## Priority: Strategic
## Effort: Medium-Large (5-7 days)
## Category: Project Management

---

## Problem

Git operations (viewing branches, resolving conflicts, understanding merge history) require terminal access. The web UI shows merge/undo buttons but no visual git state.

## Goal

Add a Git panel in the web UI showing:
- Current branch per agent
- Commit history (last 10)
- Merge conflicts (when they occur)
- Branch comparison (main vs agent branch)
- Visual diff viewer

## Current State

- Worktree system creates branches: `agent/<name>-<id>`
- Merge commits are tracked (mergeCommitStack)
- pendingMerge flag indicates unmerged work
- WORKTREE_MERGED/REVERTED events exist
- No branch listing or history API exists for frontend

## Proposed Solution

- Add `GET_GIT_STATUS` command (branches, head, changes)
- Add `GET_GIT_LOG` command (last N commits for a branch)
- Create a GitPanel component with:
  - Branch selector
  - Commit log (one-line format)
  - Merge status per agent
  - Conflict resolution guidance

## Files to Create/Modify

1. `packages/shared/src/commands.ts` — GetGitStatus, GetGitLog commands
2. `packages/shared/src/events.ts` — GitStatus, GitLog events
3. `apps/gateway/src/index.ts` — git command handlers
4. `apps/web/src/components/office/ui/GitPanel.tsx` — new panel
5. `apps/web/src/app/office/page.tsx` — add Git tab

## Micro-Phases

- [ ] Phase 1: Add GET_GIT_STATUS command (branches, current, changes count)
- [ ] Phase 2: Add GET_GIT_LOG command (last 20 commits, one-line)
- [ ] Phase 3: Create GitPanel with branch list and status
- [ ] Phase 4: Add commit log view (hash, message, author, time)
- [ ] Phase 5: Show per-agent branch status (ahead/behind main)
- [ ] Phase 6: Add merge conflict display and guidance
- [ ] Phase 7: Wire into office page as a tab/panel option

## Acceptance Criteria

- Shows all git branches in the workspace
- Commit log is readable and up-to-date
- Per-agent branch shows ahead/behind count
- Merge conflicts are clearly communicated
- Works for both team and solo agent workflows
