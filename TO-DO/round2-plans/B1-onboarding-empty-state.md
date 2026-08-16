# B1: Onboarding / Empty State

## Effort: 3 hours
## Category: UX Polish

---

## Problem
When no agents are hired, the Dashboard shows "No agents hired" and the Scene is empty. New users don't know what to do next.

## Solution
Show a guided "Get Started" card with:
- "Hire your first agent" button → opens HireModal
- "Create a team" button → opens HireTeamModal
- Brief description of what the app does
- Link to /help or keyboard shortcuts

## Files to Modify
- `apps/web/src/components/office/ui/DashboardView.tsx` — add GetStartedCard when agents.length === 0

## Micro-Phases
- [ ] Create GetStartedCard component with 3 action buttons
- [ ] Show it instead of TeamCard/TokenCard when no agents
- [ ] Add brief explanation text
