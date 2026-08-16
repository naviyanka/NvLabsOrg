# Plan: REST API / SDK

## Priority: Strategic
## Effort: Large (1-2 weeks)
## Category: Integrations & Extensibility

---

## Problem

The gateway only speaks WebSocket (and Telegram). External tools, CI/CD systems, and custom scripts can't interact with it without implementing the WS protocol.

## Goal

Expose a REST API that allows:
- Creating/firing agents
- Running tasks
- Querying agent status
- Listing projects and results
- Configuring settings

## Current State

- Gateway HTTP server exists (serves web UI + WebSocket upgrades)
- All commands go through WS channel
- No REST endpoints exist
- Authentication uses pair codes for WS

## Proposed Solution

- Add REST routes to the existing HTTP server (under `/api/v1/`)
- API key authentication (stored in config, generated on setup)
- Map REST endpoints to existing command handlers
- Return JSON responses
- Publish an OpenAPI spec

## Endpoints

```
POST   /api/v1/agents          — Create agent
DELETE /api/v1/agents/:id      — Fire agent
GET    /api/v1/agents          — List agents
POST   /api/v1/tasks           — Run task
GET    /api/v1/tasks/:id       — Get task result
POST   /api/v1/teams           — Create team
GET    /api/v1/config          — Get config
PATCH  /api/v1/config          — Update config
GET    /api/v1/projects        — List projects
GET    /api/v1/health          — Health check
```

## Files to Create/Modify

1. `apps/gateway/src/api-routes.ts` — new REST route handler
2. `apps/gateway/src/api-auth.ts` — API key validation middleware
3. `apps/gateway/src/ws-server.ts` — mount REST routes on HTTP server
4. `apps/gateway/src/config.ts` — add apiKey to config
5. `docs/api.md` — API documentation

## Micro-Phases

- [ ] Phase 1: Add API key to config + generation on first run
- [ ] Phase 2: Create REST route handler skeleton (Express-like routing)
- [ ] Phase 3: Implement health + list agents endpoints
- [ ] Phase 4: Implement create agent + fire agent endpoints
- [ ] Phase 5: Implement run task endpoint (async — returns taskId)
- [ ] Phase 6: Implement task result polling endpoint
- [ ] Phase 7: Implement config get/patch endpoints
- [ ] Phase 8: Add API key auth middleware
- [ ] Phase 9: Write OpenAPI spec + docs
- [ ] Phase 10: Create simple CLI/SDK wrapper (optional)

## Acceptance Criteria

- All core operations available via HTTP REST
- API key authentication required
- JSON request/response format
- Proper HTTP status codes
- Rate limiting (basic)
- API docs accessible at /api/docs
