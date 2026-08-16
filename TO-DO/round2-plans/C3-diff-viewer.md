# C3: Inline Diff Viewer

## Effort: 4 hours
## Category: New Capabilities

---

## Problem
Git Panel shows changed files but clicking them doesn't show the actual diff. Users must use terminal or /diff command.

## Solution
1. Add a `GET_FILE_DIFF` command (runs `git diff <file>` and returns content)
2. In GitPanel, clicking a changed file fetches + displays the diff
3. Render with +/- line highlighting (green/red)

## Files to Create/Modify
- `packages/shared/src/commands.ts` — add GetFileDiffCommand
- `packages/shared/src/events.ts` — add FileDiffEvent
- `apps/gateway/src/index.ts` — handler
- `apps/web/src/components/office/ui/GitPanel.tsx` — add diff viewer inline

## Micro-Phases
- [ ] Add GET_FILE_DIFF command + FileDiffEvent
- [ ] Implement gateway handler (git diff -- <file>)
- [ ] Add clickable files in GitPanel that fetch diff
- [ ] Render diff with line-by-line +/- coloring
