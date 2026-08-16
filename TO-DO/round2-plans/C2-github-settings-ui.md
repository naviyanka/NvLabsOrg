# C2: GitHub Settings in Web UI

## Effort: 3 hours
## Category: New Capabilities

---

## Problem
GitHub token and remote are configured only via config.json or env vars. No UI to set them.

## Solution
Add a "GitHub" section in SettingsModal:
- Token input (password type, show/hide toggle)
- Remote name input (default: "origin")
- "Push" button to push current branch
- "Create PR" button with title/body fields

## Files to Modify
- `packages/shared/src/commands.ts` — add githubToken/githubRemote to SaveConfigCommand
- `packages/shared/src/events.ts` — add githubToken to ConfigLoadedEvent
- `apps/gateway/src/index.ts` — include in GET_CONFIG + handle in SAVE_CONFIG
- `apps/web/src/components/office/ui/SettingsModal.tsx` — add GitHub section

## Micro-Phases
- [ ] Extend SaveConfigCommand + ConfigLoadedEvent with github fields
- [ ] Extend GET_CONFIG/SAVE_CONFIG handlers
- [ ] Add GitHub section in SettingsModal (token + remote + push/PR buttons)
