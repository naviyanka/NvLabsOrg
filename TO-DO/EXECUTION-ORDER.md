# Execution Order — Build Dependency Graph

This document organizes all 15 plans into an efficient build order based on:
1. **Difficulty** (easier first)
2. **Dependencies** (what unlocks what)
3. **Shared infrastructure** (build once, reuse across features)

---

## Dependency Graph

```
                    ┌─────────────────────────────────────────┐
                    │         FOUNDATION LAYER                 │
                    │  (infrastructure that others depend on)  │
                    └────────────────┬────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
     ┌────────────────┐   ┌─────────────────┐   ┌──────────────────┐
     │ 01. Markdown   │   │ 02. Smart Retry │   │ 05. Log Viewer   │
     │    Rendering   │   │   with Context  │   │                  │
     └───────┬────────┘   └────────┬────────┘   └────────┬─────────┘
             │                     │                      │
             ▼                     ▼                      │
     ┌────────────────┐   ┌─────────────────┐            │
     │ 03. Keyboard   │   │ 09. Agent Perf  │            │
     │   Shortcuts    │   │    Metrics      │            │
     └───────┬────────┘   └────────┬────────┘            │
             │                     │                      │
             ▼                     ▼                      ▼
     ┌────────────────────────────────────────────────────────────┐
     │                    VISIBILITY LAYER                         │
     │            (things users see and interact with)             │
     └────────────────────────────┬───────────────────────────────┘
                                  │
         ┌────────────────────────┼─────────────────────────┐
         ▼                        ▼                         ▼
┌─────────────────┐    ┌──────────────────┐     ┌───────────────────┐
│ 10. Notif Center│    │ 06. Dashboard    │     │ 07. Agent Timeline│
│                 │    │  Overview Page   │     │                   │
└────────┬────────┘    └────────┬─────────┘     └─────────┬─────────┘
         │                      │                          │
         └──────────┬───────────┘                          │
                    ▼                                       │
         ┌──────────────────┐                              │
         │ 04. Webhook      │                              │
         │  Notifications   │                              │
         └──────────────────┘                              │
                                                           ▼
     ┌─────────────────────────────────────────────────────────────┐
     │                    PROJECT LAYER                             │
     │         (features that build on visibility)                  │
     └──────────────────────────┬──────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ 08. Custom Team │   │ 12. File        │   │ 14. Git Panel    │
│   Templates     │   │   Explorer      │   │                  │
└────────┬────────┘   └────────┬────────┘   └────────┬─────────┘
         │                     │                      │
         │                     └──────────┬───────────┘
         │                                ▼
         │                     ┌──────────────────┐
         │                     │ 13. GitHub       │
         │                     │   Integration    │
         │                     └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADVANCED LAYER                                 │
│              (complex features, last to build)                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ 11. Task Chains │             │ 15. REST API    │
    │   / Pipelines   │             │   / SDK         │
    └─────────────────┘             └─────────────────┘
```

---

## Sprint Breakdown

### Sprint 1: Foundation (Days 1-3)
*Build the base infrastructure. Everything else depends on these.*

| Order | Plan | Time | Why First |
|-------|------|------|-----------|
| 1st | **01. Markdown Rendering** | 1-2 days | Every feature after this benefits from readable agent output. Chat UI is the most-viewed surface. |
| 2nd | **02. Smart Retry** | 1 day | Touches the orchestrator retry system — understanding gained here helps with metrics and pipelines later. |
| 3rd | **05. Log Viewer** | 1 day | Adds GET_LOGS command pattern (request → response event) which is reused by File Explorer, Git Panel, and Metrics. |

**What these unlock:**
- Markdown: makes Dashboard, Timeline, and Notification Center look good
- Smart Retry: feeds into Agent Metrics (tracking retries/success rate)
- Log Viewer: establishes the "request data from gateway, show in panel" pattern

---

### Sprint 2: Discoverability & Tracking (Days 4-7)
*Now that output looks good, help users find things and track progress.*

| Order | Plan | Time | Dependency |
|-------|------|------|-----------|
| 4th | **03. Keyboard Shortcuts** | 1 day | Standalone but makes the app more usable for power users. |
| 5th | **09. Agent Performance Metrics** | 3 days | Reuses the GET_LOGS command pattern. Data collected here feeds into Dashboard. |
| 6th | **10. Notification Center** | 3 days | Reuses the event-handling patterns. Feeds into Dashboard (recent activity). |

**What these unlock:**
- Metrics: provides data for the Dashboard's token spend card
- Notification Center: provides the "recent events" feed for Dashboard

---

### Sprint 3: Dashboard & Views (Days 8-12)
*With metrics and notifications in place, build the overview.*

| Order | Plan | Time | Dependency |
|-------|------|------|-----------|
| 7th | **06. Dashboard Overview** | 3-5 days | Uses Metrics data + Notification feed + Agent status from store |
| 8th | **07. Agent Timeline** | 3 days | Alternative view for agents — complements Dashboard's summary with detailed per-agent history |

**What these unlock:**
- Dashboard: natural home for Webhook status, File Explorer shortcut, Git status
- Timeline: enables understanding of what File Explorer should highlight

---

### Sprint 4: External Integration (Days 13-16)
*Connect the system to the outside world.*

| Order | Plan | Time | Dependency |
|-------|------|------|-----------|
| 9th | **04. Webhook Notifications** | 2 days | Simple Channel implementation. Pattern already exists (Telegram channel). |
| 10th | **08. Custom Team Templates** | 2 days | Small config addition. Standalone but benefits from Dashboard showing teams. |

**What these unlock:**
- Webhooks: lets external systems react to events (CI/CD, Slack)
- Team Templates: simplifies /hireteam flow, feeds into pipeline default teams

---

### Sprint 5: File & Git (Days 17-24)
*Deep project integration — the heaviest features.*

| Order | Plan | Time | Dependency |
|-------|------|------|-----------|
| 11th | **12. File Explorer** | 5-7 days | Requires the "request data, show in panel" pattern from Log Viewer. Creates LIST_FILES/READ_FILE commands. |
| 12th | **14. Git Integration Panel** | 5-7 days | Builds on File Explorer (same panel area). Adds GET_GIT_STATUS/LOG commands. |

**What these unlock:**
- File Explorer: makes GitHub integration meaningful (can see what to push)
- Git Panel: natural place for "Push & Create PR" button

---

### Sprint 6: Platform (Days 25-35+)
*The largest features — build on everything above.*

| Order | Plan | Time | Dependency |
|-------|------|------|-----------|
| 13th | **13. GitHub Integration** | 7-10 days | Requires Git Panel (branches), File Explorer (changed files). Adds remote operations. |
| 14th | **11. Task Chains / Pipelines** | 7-10 days | Requires Metrics (to track pipeline steps), Smart Retry (error handling). Most complex orchestration feature. |
| 15th | **15. REST API / SDK** | 7-10 days | Last — wraps all existing functionality into a programmable interface. Benefits from having all features stable first. |

---

## Quick Reference: Easiest → Hardest

| Rank | Plan | Effort | Standalone? |
|------|------|--------|-------------|
| 1 | 03. Keyboard Shortcuts | 1 day | Yes |
| 2 | 02. Smart Retry | 1 day | Yes |
| 3 | 05. Log Viewer | 1-2 days | Yes |
| 4 | 01. Markdown Rendering | 1-2 days | Yes |
| 5 | 04. Webhook Notifications | 2 days | Yes |
| 6 | 08. Custom Team Templates | 2 days | Yes |
| 7 | 10. Notification Center | 3 days | Yes |
| 8 | 09. Agent Metrics | 3-4 days | Yes |
| 9 | 07. Agent Timeline | 3-4 days | After #01 |
| 10 | 06. Dashboard | 3-5 days | After #09, #10 |
| 11 | 12. File Explorer | 5-7 days | After #05 |
| 12 | 14. Git Panel | 5-7 days | After #12 |
| 13 | 13. GitHub Integration | 7-10 days | After #14 |
| 14 | 11. Task Pipelines | 7-10 days | After #02, #09 |
| 15 | 15. REST API | 7-10 days | After all |

---

## Shared Infrastructure Patterns

These patterns are established early and reused later:

| Pattern | Established By | Reused By |
|---------|---------------|-----------|
| "Request data → Event response" | 05 (Log Viewer) | 12 (File Explorer), 14 (Git Panel), 09 (Metrics) |
| "New panel/tab in office page" | 07 (Timeline) | 06 (Dashboard), 12 (File Explorer), 14 (Git Panel) |
| "Channel interface for outbound" | 04 (Webhooks) | None (standalone) |
| "Persist counters to disk" | 09 (Metrics) | 11 (Pipeline progress) |
| "Notification event → UI badge" | 10 (Notif Center) | 06 (Dashboard activity card) |
| "Config schema extension" | 08 (Team Templates) | 13 (GitHub token), 04 (Webhook URLs) |

---

## Recommended Starting Point

If you want to build **one feature right now** that gives the biggest bang for buck:

**Start with Plan 01 (Markdown Rendering)** — it's 1-2 days, completely standalone, and immediately makes every single agent conversation more readable. Every future feature benefits from it.

Then do **Plan 02 (Smart Retry)** — 1 day, improves agent reliability, touches orchestrator internals which builds understanding for the bigger features.

Then **Plan 05 (Log Viewer)** — 1-2 days, establishes the "request → event" pattern you'll use 4 more times.

After those three, you'll have momentum and infrastructure for everything else.
