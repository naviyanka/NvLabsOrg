# V2: Dashboard Redesign — "NVLabs Mission Control"

## Effort: 5-7 days
## Category: Major Frontend Redesign

---

## Feasibility Evaluation

### Backend Compatibility: ✅ YES — 100% compatible

Every section of the proposed dashboard has data already available from the existing gateway. No new backend work needed for most cards — just a new frontend layout that queries existing commands.

| Dashboard Section | Backend Data Source | Status |
|---|---|---|
| **Active Agents (24/32)** | `orc.getAllAgents()` via PING/AGENTS_SYNC | ✅ Already available |
| **Active Tasks (18/50)** | Agent statuses (working count) + metrics | ✅ Available |
| **Pipelines (7/15)** | `config.pipelines` + `getActivePipelines()` | ✅ Available |
| **Token Usage (1.24M)** | `getAllMetrics()` → totalInputTokens + totalOutputTokens | ✅ Available |
| **Est. Spend ($42.68)** | CostEstimator model pricing × tokens | ✅ Already built |
| **Agent Network (office view)** | Existing PixelOfficeScene component | ✅ Already built |
| **Pipeline Execution (progress bars)** | PIPELINE_PROGRESS events | ✅ Available |
| **Live Activity feed** | Notifications store + real-time events | ✅ Available |
| **Quick Actions** | Existing commands (CREATE_AGENT, RUN_TASK, etc.) | ✅ Available |
| **Recent Tasks** | Agent messages + metrics | ✅ Available |
| **Top Agents** | `getAllMetrics()` sorted by success rate | ✅ Available |
| **System Status** | WebSocket state, gateway health, config | ✅ Available |
| **Token & Cost chart** | Would need time-series data | ⚠️ Needs new endpoint |
| **Search (Ctrl+K)** | CommandPalette already exists | ✅ Already built |
| **Left sidebar nav** | Already have LeftSidebar + view modes | ✅ Adapt existing |

### What's New (minor backend additions needed):
1. **Token history time-series** — Need to track hourly/daily token totals (new file or extend metrics)
2. **Pipeline progress percentage** — Derive from step completion ratio (already calculable)
3. **System health endpoint** — Memory store + Vector DB status (simple health check)

---

## Architecture Decision

### Option A: Replace existing DashboardView ← RECOMMENDED
The current `DashboardView.tsx` is a simple card layout (~150 lines). Replace it with the full Mission Control layout while keeping the backend unchanged.

### Option B: Create separate app/route
More work, splits the codebase, not recommended.

### Decision: Option A — New `MissionControlDashboard.tsx` replaces `DashboardView.tsx`

---

## Layout Breakdown (from the mockup)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Search (Ctrl+K) │ Dashboard/Office toggle │ Notifications │ User│
├────────────┬─────────────────────────────────────────────────────────────┤
│            │ Header: "NVLabs Mission Control" + subtitle                  │
│  Left      ├─────────────────────────────────────────────────────────────┤
│  Sidebar   │ Stat Cards: Active Agents │ Active Tasks │ Pipelines │      │
│            │             Token Usage │ Est. Spend                         │
│  - Overview├────────────────────┬────────────────────┬───────────────────┤
│  - Office  │ Agent Network      │ Pipeline Execution │ Live Activity     │
│  - HR Room │ (mini office view) │ (progress bars)    │ (event feed)      │
│  - Agents  ├────────────────────┴────────────────────┴───────────────────┤
│  - Tasks   │ Quick Actions: Add Agent │ Create Task │ New Pipeline │ ... │
│  - Pipeline├──────────────────────────┬──────────────────────────────────┤
│  - Memory  │ Recent Tasks             │ Top Agents                       │
│  - Git     │ (task list with progress)│ (leaderboard)                    │
│  - KB      ├──────────────────────────┴──────────────────────────────────┤
│  - Activity│ Token & Cost Overview (chart)                               │
│  - Notifs  │                                                             │
│  - Settings│ Ask NVLabs anything... [Ctrl K]                            │
│            │                                                             │
│ Sys Status │                                                             │
│ - Gateway  │                                                             │
│ - WS       │                                                             │
│ - DB       │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Micro-Phases

### Phase 1: Layout Shell + Top Bar + Left Sidebar (3h)
- [ ] Create `MissionControlDashboard.tsx` with full-page layout
- [ ] Implement left sidebar with nav items (Overview, Office, HR Room, Agents, Tasks, Pipelines, Memory, Git Repos, Knowledge Base, Activity, Notifications, Settings)
- [ ] Implement top bar with search trigger (opens CommandPalette), Dashboard/Office toggle, notification bell, user avatar
- [ ] System Status section in sidebar footer (Gateway, WebSocket, Database, Memory Store)
- [ ] Replace `DashboardView` usage in office page with new component

### Phase 2: Stat Cards Row (1h)
- [ ] Active Agents card (count / total definitions, % change indicator)
- [ ] Active Tasks card (working agents count / max capacity)
- [ ] Pipelines card (running / total saved)
- [ ] Token Usage card (24h total with % change)
- [ ] Est. Spend card (24h cost from CostEstimator pricing)

### Phase 3: Agent Network + Pipeline Execution (2h)
- [ ] Agent Network section — mini version of PixelOfficeScene OR a node-graph visualization showing agent positions + status indicators (Working/Idle/Review/Offline dots)
- [ ] Pipeline Execution section — list of running pipelines with progress bars (% = completed steps / total steps), play button to expand details
- [ ] "+3 More Pipelines" collapsible

### Phase 4: Live Activity Feed (1.5h)
- [ ] Real-time event stream from notifications store
- [ ] Each entry: timestamp, icon (by event type), description, agent name
- [ ] Filter dropdown (All / Tasks / Pipelines / System)
- [ ] "View All Activity →" link opens full activity log

### Phase 5: Quick Actions + Recent Tasks + Top Agents (2h)
- [ ] Quick Actions row: Add Agent, Create Task, New Pipeline, Open HR Room, View Office — each with icon + label, triggers existing modals/views
- [ ] Recent Tasks section: latest task per agent (name, progress bar, time)
- [ ] Top Agents leaderboard: sorted by success rate, shows backend + performance bar

### Phase 6: Token & Cost Chart (2h)
- [ ] Add a simple time-series store (hourly buckets, last 24h) in the gateway
- [ ] New `GET_TOKEN_HISTORY` command that returns { hour: number, tokens: number, cost: number }[]
- [ ] Render as a line/area chart (using inline SVG or a lightweight chart lib)
- [ ] Total Tokens + Total Cost summary below chart

### Phase 7: Sidebar Navigation Logic (1.5h)
- [ ] Each nav item changes the main content area:
  - Overview → the dashboard itself
  - Office → switches to PixelOfficeScene (existing viewMode="scene")
  - HR Room → opens HireModal/HireTeamModal area
  - Agents → agent list/management view
  - Tasks → task queue/history view
  - Pipelines → PipelineBuilder
  - Memory → memory inspection view
  - Git Repos → GitPanel
  - Knowledge Base → skills/docs viewer
  - Activity → full notification log
  - Notifications → notification drawer
  - Settings → SettingsModal
- [ ] Active nav item highlighted
- [ ] Sidebar collapsible on smaller screens

### Phase 8: Polish + Responsive (2h)
- [ ] Dark theme with the gradient cards and glow effects from mockup
- [ ] Responsive: sidebar collapses on tablet, full-screen on mobile
- [ ] Smooth transitions between views
- [ ] "Ask NVLabs anything..." footer input (triggers CommandPalette)
- [ ] Keyboard shortcuts (Ctrl+K search, sidebar nav shortcuts)
- [ ] Loading states for each section

---

## Tech Decisions

| Aspect | Choice | Reasoning |
|--------|--------|-----------|
| Chart library | Inline SVG paths | No new deps, tiny bundle, full control |
| Layout | CSS Grid + Flexbox | Already used throughout the app |
| State | Existing Zustand store | All data already flows through it |
| Components | Extend existing primitives (TermButton, TermModal, etc.) | Consistency |
| Sidebar | New component replacing LeftSidebar | More feature-rich than current 48px bar |

---

## Data Requirements (what to query on mount)

```
On dashboard load:
1. PING (gets AGENTS_SYNC with all agent states)
2. GET_CONFIG (system status, workspace, backends)
3. GET_METRICS (token/task stats per agent)
4. LIST_PIPELINES (saved pipeline count)
5. LIST_SCHEDULES (scheduled task count)
6. GET_TOKEN_HISTORY (new — for the chart)
```

---

## Files to Create

```
apps/web/src/components/dashboard/
├── MissionControlDashboard.tsx    # Main layout orchestrator
├── DashboardSidebar.tsx           # Left navigation sidebar
├── DashboardTopBar.tsx            # Top bar with search/toggle/user
├── StatCards.tsx                   # The 5 stat cards row
├── AgentNetworkCard.tsx           # Mini office/network view
├── PipelineExecutionCard.tsx      # Running pipelines with progress
├── LiveActivityFeed.tsx           # Real-time event stream
├── QuickActions.tsx               # Action buttons row
├── RecentTasks.tsx                # Latest tasks per agent
├── TopAgents.tsx                  # Agent leaderboard
├── TokenCostChart.tsx             # SVG line chart for tokens/cost
└── SystemStatus.tsx               # Sidebar system health indicators
```

---

## Estimated Total: 5-7 days

This is a pure frontend effort — the backend already provides all the data. The only new backend addition is a simple `GET_TOKEN_HISTORY` endpoint that tracks hourly token totals (2h work max).
