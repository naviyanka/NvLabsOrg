<div align="center">

# NVLabs Org

### A visible workspace for AI agents to collaborate as a single team.

[![npm version](https://img.shields.io/npm/v/nvlabs-org?color=cb3837&logo=npm)](https://www.npmjs.com/package/nvlabs-org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/naviyanka/NvLabsOrg/pulls)

**Supports Claude, Codex, Gemini (Antigravity), Kiro, Copilot, Cursor, Aider, OpenCode & more — one team**

[Quick Start](#quick-start) | [Features](#features) | [Architecture](#architecture) | [REST API](#rest-api) | [Contributing](#contributing)

</div>

---

## Features

### Core
- **8+ AI backends** — Claude Code, Codex, Antigravity (Gemini), Kiro, Copilot, Cursor, Aider, OpenCode
- **Team-based delivery** — Leader coordinates planning, coding, review, and release
- **Parallel collaboration** — Worktree isolation with auto commit, merge, and undo
- **Pipeline engine** — Multi-step task chains with auto-advancement and context injection
- **Persistent memory** — 4-layer memory across sessions and agents

### Web UI
- **4 view modes** — Pixel office scene, Dashboard, File Explorer, Git Panel
- **Slash commands** — Type `/` in chat for 24+ commands (dynamic from backend)
- **Theme system** — 18 terminal themes with live switching in Settings
- **Pipeline Builder** — Visual editor for creating multi-step pipelines
- **Diff Viewer** — Inline git diff with +/- line coloring
- **Notification Center** — Bell badge + toast notifications for task events
- **Agent Context Menu** — Right-click for quick actions (fire, cancel, assign)
- **Cost Estimator** — Per-agent and session cost tracking based on model pricing
- **Chat Export** — Download any agent conversation as Markdown
- **Skeleton Loaders** — Smooth loading states for all panels
- **Error Boundaries** — Panel crashes are isolated, retry without page reload
- **Mobile Responsive** — Touch-friendly on phones and tablets

### Infrastructure
- **REST API** — 22 authenticated endpoints with rate limiting (120 req/min)
- **WebSocket** — Exponential backoff reconnection with command queue
- **Scheduled Tasks** — Cron-lite recurring tasks (persisted, survives restarts)
- **Multi-workspace** — Switch between projects from Settings
- **Telegram Bot** — 25+ commands for remote control
- **Token tracking** — Real-time usage and cost estimation per agent
- **Webhooks** — POST notifications for task events to external systems

## Quick Start

```bash
npx nvlabs-org
```

Opens the web UI at `http://localhost:9090`. The gateway auto-detects installed AI CLIs.

## Run from Source

### Prerequisites

- **Node.js** 18+
- **pnpm** 9+
- At least one AI CLI installed (see [Supported Backends](#supported-backends))

### Setup

```bash
git clone https://github.com/naviyanka/NvLabsOrg.git
cd NvLabsOrg
pnpm install
pnpm dev
```

This starts:
- **Gateway** on `ws://localhost:9099` (dev) — handles AI agents, events, commands
- **Web UI** on `http://localhost:3000` (Turbopack) — Next.js frontend

### Production Build

```bash
pnpm build
pnpm start
```

## Desktop App (Tauri)

Also ships as a native desktop app powered by [Tauri v2](https://tauri.app).

```bash
# Dev mode
pnpm dev:desktop

# Build release (.app / .dmg / .exe)
pnpm build:desktop
```

## Supported Backends

Auto-detected at startup. Each backend has its own instruction file convention.

| Backend | Command | Stability | Guard | Instruction File | Resume | Structured Output |
|---|---|---|---|---|---|---|
| **Claude Code** | `claude` | Stable | Hooks | `.claude/CLAUDE.md` | Yes | Yes (stream-json) |
| **Codex CLI** | `codex` | Stable | Sandbox | `AGENTS.md` | — | — |
| **Antigravity** | `agy` | Beta | Flag | `GEMINI.md` | Yes | Yes (stream-json) |
| **Kiro CLI** | `kiro-cli` | Beta | Flag | `.kiro/steering/default.md` | Yes | — |
| **GitHub Copilot** | `copilot` | Experimental | — | `.github/copilot-instructions.md` | — | — |
| **Cursor CLI** | `agent` | Experimental | — | `.cursor/rules/instructions.md` | — | — |
| **Aider** | `aider` | Experimental | — | `.aider.conf.yml` | — | — |
| **OpenCode** | `opencode` | Experimental | — | `AGENTS.md` | — | Yes (json) |

## Slash Commands

Type `/` in any agent chat to see the autocomplete menu. Commands are served dynamically from the gateway based on detected backends.

| Category | Commands |
|----------|----------|
| **Agent** | `/cancel`, `/fire`, `/retry`, `/clear` |
| **Project** | `/project <path>`, `/git`, `/diff`, `/files`, `/push`, `/pr <title>` |
| **Multi-Agent** | `/broadcast <msg>`, `/hire`, `/hireteam`, `/switch <backend>` |
| **Claude** | `/compact`, `/model sonnet\|opus\|haiku`, `/permissions` |
| **Kiro** | `/model <name>`, `/spec` |
| **Aider** | `/add <file>`, `/drop <file>`, `/model <model>` |
| **Tools** | `/export`, `/pipeline`, `/settings`, `/schedule <min> <prompt>` |
| **Info** | `/help`, `/status`, `/metrics`, `/backends` |

## REST API

Authenticated with `X-API-Key` header. Rate limited to 120 requests/minute.

```
GET    /api/v1/health
GET    /api/v1/agents
GET    /api/v1/agents/:id
POST   /api/v1/agents
DELETE /api/v1/agents/:id
POST   /api/v1/teams
DELETE /api/v1/teams
POST   /api/v1/tasks
GET    /api/v1/pipelines
POST   /api/v1/pipelines/run
GET    /api/v1/metrics
DELETE /api/v1/metrics
GET    /api/v1/git/status?path=
GET    /api/v1/git/log?path=&count=
POST   /api/v1/git/push
POST   /api/v1/git/pr
GET    /api/v1/files?path=&depth=
GET    /api/v1/files/content?path=
GET    /api/v1/webhooks
POST   /api/v1/webhooks
DELETE /api/v1/webhooks/:index
GET    /api/v1/config
PATCH  /api/v1/config
```

## Architecture

```
NvLabsOrg/
├── apps/
│   ├── web/            # Next.js 15 PWA — office scene, dashboard, panels
│   ├── gateway/        # Node.js daemon — orchestration, channels, REST API
│   └── desktop/        # Tauri v2 native shell (macOS/Windows/Linux)
└── packages/
    ├── memory/         # Four-layer persistent memory (session → agent → shared)
    ├── orchestrator/   # Multi-agent execution, retry, delegation, pipelines
    └── shared/         # Zod-validated command/event schemas
```

### Communication Channels
- **WebSocket** — Primary (always on, exponential backoff reconnect)
- **Ably** — Optional real-time (for remote/mobile access)
- **Telegram** — Optional bot control (25+ commands)
- **REST API** — Programmatic access (22 endpoints)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Zustand, Tailwind CSS 3, PixiJS v8 |
| Desktop | Tauri v2 (Rust + system WebView) |
| Gateway | Node.js, WebSocket (ws), TypeScript |
| Memory | JSON store with Jaccard dedup |
| Schemas | Zod (shared between gateway + web) |
| Integrations | Ably, Telegram, GitHub (push/PR) |

## Contributing

Issues and PRs are welcome. The codebase is organized as a pnpm monorepo with clear separation between the gateway (backend), web (frontend), and shared packages.

```bash
# Type-check everything
pnpm -r typecheck

# Build web only
pnpm --filter web build

# Build gateway only
pnpm --filter nvlabs-org build
```

## License

[MIT](LICENSE)

---

<div align="center">

**Built with AI agents, for AI agents.**

</div>
