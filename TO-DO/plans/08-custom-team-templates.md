# Plan: Custom Team Templates

## Priority: High Impact
## Effort: Small (2 days)
## Category: Team & Collaboration

---

## Problem

Creating a team always requires selecting agents one by one. Users who frequently need the same team composition (e.g. "Game Dev Team", "Full Stack Team") have to rebuild it every time.

## Goal

Allow users to save and load team templates — predefined agent compositions with roles, backends, and working directories.

## Current State

- Team creation uses HireTeamModal with manual selection
- Default team is hardcoded (marcus + rex + sophie)
- Telegram `/hireteam` creates the hardcoded default team
- No template saving/loading exists

## Proposed Solution

- Add "Save as Template" button after creating a team
- Add "Load Template" dropdown in HireTeamModal
- Templates stored in config.json under `teamTemplates` array
- Each template: `{ name, members: [{ defId, backend }], workDir? }`
- Show templates in both web UI and Telegram (/hireteam list, /hireteam <name>)

## Files to Create/Modify

1. `apps/gateway/src/config.ts` — add teamTemplates to SavedConfig
2. `packages/shared/src/commands.ts` — add SaveTeamTemplate, ListTeamTemplates commands
3. `apps/web/src/components/office/ui/HireTeamModal.tsx` — add template dropdown + save button
4. `apps/gateway/src/telegram-channel.ts` — enhance /hireteam to support template names

## Micro-Phases

- [ ] Phase 1: Define team template schema in config
- [ ] Phase 2: Add SAVE_TEAM_TEMPLATE and LIST_TEAM_TEMPLATES commands
- [ ] Phase 3: Implement gateway handlers (persist + load from config)
- [ ] Phase 4: Add template dropdown to HireTeamModal
- [ ] Phase 5: Add "Save current team as template" button
- [ ] Phase 6: Update Telegram /hireteam to list/use templates

## Acceptance Criteria

- Users can save the current team composition as a named template
- Templates appear in the hire modal dropdown
- Loading a template creates the full team in one click
- Templates persist across restarts
- Telegram /hireteam supports template names
