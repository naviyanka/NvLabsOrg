# A1: Clear Agent Memory

## Effort: 1 hour
## Category: Finish Half-Built

---

## Problem
The "Clear Agent Memory" button in Settings is disabled with "Coming soon". The backend function `clearMemory()` already exists in the orchestrator.

## Solution
1. Add a `CLEAR_MEMORY` command to shared types
2. Add gateway handler that calls `clearMemory()` from orchestrator
3. Wire the button in SettingsModal to send the command with a confirmation dialog

## Files to Modify
- `packages/shared/src/commands.ts` — add ClearMemoryCommand
- `apps/gateway/src/index.ts` — add handler
- `apps/web/src/components/office/ui/SettingsModal.tsx` — enable button + confirm

## Micro-Phases
- [ ] Add ClearMemoryCommand + handler
- [ ] Enable button with confirm() dialog
