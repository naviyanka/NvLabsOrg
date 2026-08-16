# A4: Dashboard Auto-Refresh

## Effort: 1 hour
## Category: Finish Half-Built

---

## Problem
Dashboard shows a static snapshot of agent state. When agents change status (start working, finish tasks), the Dashboard doesn't update until you switch away and back.

## Solution
The Dashboard already reads from the Zustand store (`useOfficeStore`), which updates on every event. The issue is that `useMemo` caches values. Fix by adding a periodic key or removing overly aggressive memoization.

Actually — the store subscriptions should already trigger re-renders. The real issue may be that `agents` is a Map (reference doesn't change on internal mutation). Verify and fix.

## Files to Modify
- `apps/web/src/components/office/ui/DashboardView.tsx` — verify reactivity, add a refresh interval if needed

## Micro-Phases
- [ ] Verify store subscription triggers re-render on agent status change
- [ ] If not: add a 5s setInterval that forces re-read from store
