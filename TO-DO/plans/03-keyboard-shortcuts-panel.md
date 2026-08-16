# Plan: Keyboard Shortcuts Panel

## Priority: Quick Win
## Effort: Small (1 day)
## Category: UI/UX Improvements

---

## Problem

The app has a command palette (Cmd+K) and various keyboard shortcuts but no discoverability. Users don't know what's available.

## Goal

Add a keyboard shortcuts help panel (triggered by `?` or `Cmd+/`) that shows all available shortcuts in a modal overlay.

## Current State

- Command palette exists (Cmd+K / Ctrl+K) — `CommandPalette.tsx`
- Editor has keyboard shortcuts (useEditorKeyboard hook)
- No shortcuts documentation or help panel exists

## Proposed Solution

- Create a `ShortcutsModal.tsx` component
- Trigger with `?` key (when not in an input) or `Cmd+/`
- Categorized list: Navigation, Agents, Editor, General
- Style matches the terminal aesthetic (TermModal)

## Shortcuts to Document

**General:**
- `Cmd+K` — Command palette
- `?` or `Cmd+/` — This shortcuts panel
- `Escape` — Close modal/panel

**Agents:**
- `Enter` — Send message to selected agent
- `Cmd+Enter` — Send and stay focused

**Editor:**
- Tile placement, selection, etc. (from useEditorKeyboard)

## Files to Create/Modify

1. `apps/web/src/components/office/ui/ShortcutsModal.tsx` — new component
2. `apps/web/src/app/office/page.tsx` — add keyboard listener + render modal

## Micro-Phases

- [ ] Phase 1: Create ShortcutsModal component with categorized shortcut list
- [ ] Phase 2: Add global keyboard listener for `?` and `Cmd+/`
- [ ] Phase 3: Wire into office page state
- [ ] Phase 4: Add "Shortcuts" button to bottom toolbar or settings

## Acceptance Criteria

- Pressing `?` (when not typing in input) shows the panel
- All shortcuts are listed and categorized
- Panel can be dismissed with Escape or clicking outside
- Terminal-themed appearance
