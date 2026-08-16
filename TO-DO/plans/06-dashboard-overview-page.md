# Plan: Dashboard / Overview Page

## Priority: High Impact
## Effort: Medium (3-5 days)
## Category: UI/UX Improvements

---

## Problem

The app currently lands on a pixel office scene which is visually fun but doesn't communicate useful information at a glance. Users have to click through agents to understand what's happening.

## Goal

Create an optional dashboard view (toggle between pixel scene and dashboard) that shows:
- All agents with their current status (working/idle/done/error)
- Active project summary
- Recent task completions (last 5)
- Total token spend (session + all-time)
- Quick actions (hire agent, create team, start task)

## Current State

- The office page is one monolithic component (~2000 lines)
- Agent status, token usage, and project data already exist in the store
- No dashboard or summary view exists

## Proposed Solution

- Create a `DashboardView.tsx` component as an alternative to the pixel scene
- Add a toggle in the top bar: "Scene" | "Dashboard"
- Dashboard is a card-based grid layout:
  - **Team Card**: agents as rows with status dots, backend badges, current task
  - **Activity Card**: last 5 task results (agent, summary, duration, tokens)
  - **Token Card**: pie chart or bar showing spend per agent
  - **Quick Actions Card**: hire, create team, start project buttons
- Keep the pixel scene as default, dashboard as opt-in

## Files to Create/Modify

1. `apps/web/src/components/office/ui/DashboardView.tsx` — new component
2. `apps/web/src/app/office/page.tsx` — add view toggle state + render
3. `apps/web/src/components/office/ui/DashboardCard.tsx` — reusable card primitive

## Micro-Phases

- [ ] Phase 1: Create DashboardCard primitive (terminal-themed card component)
- [ ] Phase 2: Create TeamCard (agent list with status, backend, task)
- [ ] Phase 3: Create ActivityCard (recent task history)
- [ ] Phase 4: Create TokenCard (per-agent token usage summary)
- [ ] Phase 5: Create QuickActionsCard (hire, team, project buttons)
- [ ] Phase 6: Assemble DashboardView and add scene/dashboard toggle
- [ ] Phase 7: Persist view preference in localStorage

## Acceptance Criteria

- Dashboard shows real-time agent status
- Token usage is accurate per agent
- Recent activity is helpful (not just "Done")
- Toggle between pixel scene and dashboard is smooth
- Responsive on mobile
- Terminal aesthetic maintained
