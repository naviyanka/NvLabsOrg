# Round 2 Feature Plan — Polish, Connect, and Extend

Based on a full review of the app after 15 features were implemented in Round 1.

---

## What's Working Well
- 50 gateway commands covering every workflow
- 4 view modes (Scene, Dashboard, Files, Git) with cycling toggle
- REST API with key auth (6 endpoints)
- Telegram bot with 25+ commands + live streaming + inline buttons
- Notification center with bell badge
- Agent metrics tracking
- Keyboard shortcuts panel
- Syntax-highlighted code in chat
- File explorer + Git panel
- Webhooks, pipelines, team templates, GitHub push/PR

## What's Half-Built or Placeholder
1. **"Clear Agent Memory"** — disabled button, no implementation
2. **"Reset All Settings"** — disabled button, no implementation
3. **Pipeline runner** — starts first steps but doesn't watch for completion or trigger dependent steps
4. **File Explorer** — tree is flat (doesn't expand subdirectories on click)
5. **REST API** — missing: task status polling, pipeline execution, team management, webhooks config
6. **Dashboard** — static snapshot, no auto-refresh
7. **Agent Timeline** — no tool-use entries (only extracts from messages, not from LOG_APPEND)
8. **Model override** — stored in Telegram but never actually sent in RUN_TASK

---

## NEW FEATURES (Round 2)

### Category A: Finish Half-Built Features (Quick, High ROI)

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| A1 | Clear Agent Memory | 1h | Wire the disabled button to call `clearMemory()` from orchestrator + confirm dialog |
| A2 | Reset All Settings | 1h | Delete config.json + reload, with confirmation |
| A3 | Pipeline completion watcher | 3h | Listen for TASK_DONE events, match to pipeline steps, trigger dependents with context |
| A4 | Dashboard auto-refresh | 1h | Re-render every 5s when in dashboard view (or subscribe to store changes) |
| A5 | Expand subdirectories in File Explorer | 2h | Click a dir to LIST_FILES just that subdirectory (lazy loading) |
| A6 | REST API expansion | 4h | Add: GET /tasks/:id/status, POST /teams, POST /pipelines/run, GET /webhooks, DELETE /webhooks |
| A7 | Model override in RUN_TASK | 1h | Actually pass the Telegram `agentModelOverride` value to the agent |

### Category B: UX Polish (Medium, High Visibility)

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| B1 | Onboarding / Empty State | 3h | When no agents are hired, show a guided "Get Started" card in Dashboard instead of "No agents" |
| B2 | Theme selector in Settings | 2h | Move the terminal theme chooser (already in page) into Settings for discoverability |
| B3 | Agent context menu | 2h | Right-click agent in team list → Fire, Change backend, View metrics, View timeline |
| B4 | Toast notifications | 2h | Brief slide-up toasts for task done/failed (in addition to bell badge) |
| B5 | Persistent view mode | 30m | Remember last view mode (scene/dashboard/files/git) in localStorage |
| B6 | Loading states | 2h | Add skeleton loaders to Dashboard, File Explorer, Git Panel while fetching |
| B7 | Error boundaries | 2h | Wrap each panel/modal in error boundary so one crash doesn't kill the UI |
| B8 | Mobile responsive polish | 4h | Fix the dashboard + panels on small screens (currently overflows) |

### Category C: New Capabilities (Larger, Strategic)

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| C1 | Pipeline Builder UI | 1d | Visual editor for pipelines: add steps, set roles/prompts, connect dependencies |
| C2 | GitHub Settings in Web UI | 3h | Add GitHub token + remote config to Settings modal (currently only in config.json) |
| C3 | Diff Viewer in File Explorer | 4h | When clicking a changed file (from git status), show the diff inline with +/- highlighting |
| C4 | Task Cost Estimator | 3h | Show estimated cost before running (based on average tokens × model pricing) |
| C5 | Agent Chat Export | 2h | Download agent conversation as markdown file |
| C6 | Multi-workspace support | 1d | Switch between workspaces from the UI (currently hardcoded to default) |
| C7 | Scheduled tasks / Cron | 1d | "Run this task every N hours" — timer-based recurring agent tasks |
| C8 | Session replay | 2d | Record all events and replay a team session visually (like a time-lapse) |
| C9 | AI model comparison | 1d | Run the same task on 2+ backends, compare outputs side-by-side |
| C10 | Voice input | 3h | Microphone button → Web Speech API → text → send to agent |

### Category D: Infrastructure Improvements

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| D1 | Replace node-telegram-bot-api | 4h | Swap to `grammy` — better TypeScript support, middleware, webhook mode option |
| D2 | SQLite for memory/metrics | 1d | Replace JSON file storage with better-sqlite3 for ACID + query performance |
| D3 | WebSocket reconnection with backoff | 2h | Replace manual reconnect with exponential backoff + queue unsent commands |
| D4 | Rate limiting on REST API | 2h | Basic request-per-minute limiter per API key |
| D5 | OpenAPI spec generation | 3h | Auto-generate OpenAPI 3.0 docs from the Zod schemas |
| D6 | Proper test suite | 2d | Unit tests for orchestrator, metrics, retry, pipeline runner |
| D7 | Docker Compose setup | 3h | Single `docker compose up` to run gateway + web in containers |

---

## Recommended Execution Order

### Quick Round (1-2 days)
Finish the half-built stuff + quick polish:
1. A1 (Clear Memory) + A2 (Reset) — 2h total
2. A4 (Dashboard auto-refresh) — 1h
3. A7 (Model override fix) — 1h
4. B5 (Persist view mode) — 30m
5. B1 (Empty state / onboarding) — 3h

### Medium Round (3-5 days)
6. A3 (Pipeline completion watcher) — 3h
7. A5 (File Explorer lazy dirs) — 2h
8. C2 (GitHub Settings UI) — 3h
9. B2 (Theme in Settings) — 2h
10. B3 (Agent context menu) — 2h
11. A6 (REST API expansion) — 4h

### Strategic Round (1-2 weeks)
12. C1 (Pipeline Builder UI) — 1d
13. C3 (Diff Viewer) — 4h
14. C6 (Multi-workspace) — 1d
15. D1 (Replace telegram lib) — 4h
16. D6 (Test suite) — 2d
17. C9 (AI model comparison) — 1d

---

## Key Insight

The biggest gap isn't missing features — it's **connecting features that already exist**:
- Pipelines exist but don't auto-advance
- Model override is stored but never used
- GitHub push/PR exist but have no UI buttons
- Webhooks exist but have no UI for removing/editing
- Team templates exist but have no UI for saving the current team

The highest ROI is finishing what's started, not adding more new things.
