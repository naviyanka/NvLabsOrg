# B5: Persist View Mode

## Effort: 30 minutes
## Category: UX Polish

---

## Problem
View mode (Scene/Dashboard/Files/Git) resets to "scene" on every page load.

## Solution
Save to localStorage on change, restore on mount.

## Files to Modify
- `apps/web/src/app/office/page.tsx` — save/restore viewMode

## Micro-Phases
- [ ] On viewMode change: localStorage.setItem("nvlabs-org-view-mode", viewMode)
- [ ] On mount useEffect: restore from localStorage
