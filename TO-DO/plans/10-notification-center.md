# Plan: In-App Notification Center

## Priority: High Impact
## Effort: Medium (3 days)
## Category: UI/UX Improvements

---

## Problem

Events happen in the background (task completions, failures, approvals needed, team phase changes) but the only way to notice them is to be actively watching the right agent panel or check Telegram.

## Goal

Add a notification bell/drawer in the web UI that collects important events and shows an unread count badge.

## Current State

- Desktop notifications exist for Tauri (notifyTaskDone)
- No in-app notification system
- Events are dispatched to the store but not surfaced proactively to the user

## Proposed Solution

- Add a `notifications` array to the store (max 50, persisted in localStorage)
- Populate from key events: TASK_DONE, TASK_FAILED, APPROVAL_NEEDED, AGENT_CREATED
- Show a bell icon in the top bar with unread count badge
- Clicking opens a slide-out drawer with the notification list
- Each notification has: icon, title, body, timestamp, read/unread state
- Click a notification to navigate to the relevant agent

## Files to Create/Modify

1. `apps/web/src/store/office-store.ts` — add notifications state + handlers
2. `apps/web/src/components/office/ui/NotificationDrawer.tsx` — new component
3. `apps/web/src/components/office/ui/NotificationBell.tsx` — bell icon + badge
4. `apps/web/src/app/office/page.tsx` — render bell + drawer

## Micro-Phases

- [ ] Phase 1: Add notifications array + actions to store (add, markRead, clear)
- [ ] Phase 2: Populate notifications from TASK_DONE, TASK_FAILED, APPROVAL_NEEDED events
- [ ] Phase 3: Create NotificationBell component (bell icon + unread count badge)
- [ ] Phase 4: Create NotificationDrawer (slide-out list with timestamps)
- [ ] Phase 5: Add click-to-navigate (select the relevant agent on click)
- [ ] Phase 6: Persist read/unread state in localStorage

## Acceptance Criteria

- Bell shows unread count
- Notifications appear for task done, failed, and approvals
- Clicking a notification selects the relevant agent
- Notifications persist across page refreshes
- Old notifications auto-expire (keep last 50)
- Doesn't duplicate with desktop notifications
