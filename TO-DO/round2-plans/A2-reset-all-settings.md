# A2: Reset All Settings

## Effort: 1 hour
## Category: Finish Half-Built

---

## Problem
"Reset All Settings" button is disabled. Need to delete config.json and reload.

## Solution
1. Add a `RESET_CONFIG` command
2. Gateway handler deletes config.json, reloads config, returns fresh CONFIG_LOADED
3. Button triggers confirm + sends command

## Files to Modify
- `packages/shared/src/commands.ts` — add ResetConfigCommand
- `apps/gateway/src/index.ts` — handler: delete config.json, reload
- `apps/web/src/components/office/ui/SettingsModal.tsx` — enable button

## Micro-Phases
- [ ] Add command + gateway handler (delete + reload)
- [ ] Enable button with destructive confirmation
