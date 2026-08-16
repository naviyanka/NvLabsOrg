# A5: Expand Subdirectories in File Explorer

## Effort: 2 hours
## Category: Finish Half-Built

---

## Problem
File Explorer shows root directory contents (depth 2) but clicking a subdirectory doesn't expand it to load deeper contents. Users can't browse into nested project structures.

## Solution
1. When a directory node is clicked, send a new `LIST_FILES` command scoped to that directory
2. Merge results into existing entries (append children)
3. Track which dirs are expanded in local state

## Files to Modify
- `apps/web/src/components/office/ui/FileExplorer.tsx` — add per-dir expansion with lazy fetch

## Micro-Phases
- [ ] Add `expandedDirs` Set state
- [ ] On dir click: if not in set, send LIST_FILES for that path, add to set
- [ ] Store per-directory children in a Map (not just flat list)
- [ ] Render recursively based on expanded state
