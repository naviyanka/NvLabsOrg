# B2: Theme Selector in Settings

## Effort: 2 hours
## Category: UX Polish

---

## Problem
Terminal themes exist (TERM_THEMES in termTheme.ts) and are applied via `applyTermTheme()` but the selector is buried in the page code. Users can't easily discover or change it.

## Solution
Add a "Theme" section in SettingsModal with visual swatches for each theme.

## Files to Modify
- `apps/web/src/components/office/ui/SettingsModal.tsx` — add Theme section with swatch buttons
- Read TERM_THEMES object and render each as a clickable color square

## Micro-Phases
- [ ] Import TERM_THEMES into SettingsModal
- [ ] Render theme swatches (colored squares with names)
- [ ] On click: call applyTermTheme + save to localStorage
- [ ] Highlight the active theme
