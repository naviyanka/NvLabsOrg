# Plan: GitHub / GitLab Integration

## Priority: Strategic
## Effort: Large (1-2 weeks)
## Category: Integrations & Extensibility

---

## Problem

All agent work stays local. Users must manually push to remote repos, create PRs, and link to issues. For team workflows, this is a significant friction point.

## Goal

Integrate with GitHub (and optionally GitLab) to:
- Push agent branches to remote
- Create Pull Requests from completed work
- Link tasks to issues
- Show PR status in the UI

## Current State

- Git worktree system creates local branches per agent
- Merge/undo system works locally
- No remote operations exist
- GitHub CLI (`gh`) may be available on the machine

## Proposed Solution

**Phase A: Push & PR via CLI**
- Use `gh` CLI (if available) or direct GitHub API
- After team work completes, offer "Push & Create PR" button
- Auto-generate PR title/description from task summary + changed files

**Phase B: Issue linking**
- Accept GitHub issue URL in task prompt
- Auto-reference issue in PR description
- Comment on issue with task result

**Phase C: Status sync**
- Show PR status (open/merged/closed) in the UI
- Notify when PR is reviewed or merged

## Files to Create/Modify

1. `apps/gateway/src/github.ts` — new module (push, create PR, issue link)
2. `packages/shared/src/commands.ts` — PushBranch, CreatePR commands
3. `apps/gateway/src/config.ts` — add github token/repo to config
4. `apps/gateway/src/index.ts` — handlers for git remote operations
5. `apps/web/src/components/office/ui/GitPanel.tsx` — PR creation UI
6. `apps/web/src/components/office/ui/SettingsModal.tsx` — GitHub token config

## Micro-Phases

- [ ] Phase 1: Add GitHub token to config + settings UI
- [ ] Phase 2: Implement git push (to remote branch)
- [ ] Phase 3: Implement PR creation via `gh` CLI or API
- [ ] Phase 4: Add "Push & Create PR" button on task completion
- [ ] Phase 5: Auto-generate PR title/description from task result
- [ ] Phase 6: Add issue linking (extract from prompt or manual input)
- [ ] Phase 7: Show PR status in agent pane
- [ ] Phase 8: Add webhook for PR merge notification

## Acceptance Criteria

- Users can push agent work to GitHub with one click
- PR is auto-created with meaningful title and description
- GitHub token is stored securely in config
- Works with both personal and org repos
- Graceful failure if `gh` CLI not available (fallback to API)
