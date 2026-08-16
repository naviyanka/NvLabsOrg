# Plan: File Explorer Panel

## Priority: Strategic
## Effort: Medium-Large (5-7 days)
## Category: UI/UX Improvements

---

## Problem

When agents modify files, users only see filenames in the task result. There's no way to browse the project's file structure or view diffs from the web UI.

## Goal

Add a file explorer panel that shows:
- Project file tree (from the workspace directory)
- Files changed by each agent (highlighted)
- Click to view file content or diff
- Git status indicators (modified, added, untracked)

## Current State

- `changedFiles` array is returned in TaskResultPayload
- Git diff is available server-side (used in code review)
- No file system browsing API exists for the frontend
- `OPEN_FILE` command exists (opens in native editor) but no read/list

## Proposed Solution

- Add `LIST_FILES` command (returns file tree for a directory, max depth 3)
- Add `READ_FILE` command (returns file content, max 100KB)
- Add `GET_DIFF` command (returns git diff for specific files)
- Create a collapsible tree view component
- Add it as a panel option (alongside agents, team chat)
- Highlight files that were changed by agents

## Files to Create/Modify

1. `packages/shared/src/commands.ts` — add ListFiles, ReadFile, GetDiff commands
2. `packages/shared/src/events.ts` — add FileList, FileContent, DiffResult events
3. `apps/gateway/src/index.ts` — handlers for new commands
4. `apps/web/src/components/office/ui/FileExplorer.tsx` — tree view
5. `apps/web/src/components/office/ui/FileViewer.tsx` — content/diff view
6. `apps/web/src/app/office/page.tsx` — add panel tab

## Micro-Phases

- [ ] Phase 1: Add LIST_FILES command + handler (recursive dir listing)
- [ ] Phase 2: Add READ_FILE command + handler (content with line numbers)
- [ ] Phase 3: Add GET_DIFF command + handler (git diff for files)
- [ ] Phase 4: Create FileExplorer tree view component
- [ ] Phase 5: Create FileViewer with syntax highlighting
- [ ] Phase 6: Add "Files" panel tab to office page
- [ ] Phase 7: Highlight agent-changed files in the tree
- [ ] Phase 8: Add git status indicators (M/A/? icons)

## Acceptance Criteria

- File tree loads for the active project directory
- Clicking a file shows its content with syntax highlighting
- Changed files are visually distinguished
- Diff view shows what an agent modified
- Security: can't browse outside workspace
- Performance: lazy-loads deep directories
