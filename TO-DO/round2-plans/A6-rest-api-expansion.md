# A6: REST API Expansion

## Effort: 4 hours
## Category: Finish Half-Built

---

## Problem
REST API only has 6 endpoints. Missing: task status, team management, pipeline execution, webhook management, file/git operations.

## Solution
Add endpoints that map to existing gateway commands:

```
GET    /api/v1/agents/:id          — Get single agent
POST   /api/v1/teams               — Create team
DELETE /api/v1/teams               — Fire team
POST   /api/v1/pipelines/run       — Run a pipeline
GET    /api/v1/metrics             — Get agent metrics
GET    /api/v1/git/status?path=    — Git status
GET    /api/v1/git/log?path=       — Git log
POST   /api/v1/git/push            — Push branch
POST   /api/v1/git/pr              — Create PR
GET    /api/v1/files?path=         — List files
GET    /api/v1/files/content?path= — Read file
GET    /api/v1/webhooks            — List webhooks
POST   /api/v1/webhooks            — Add webhook
DELETE /api/v1/webhooks/:index     — Remove webhook
```

## Files to Modify
- `apps/gateway/src/api-routes.ts` — add all new endpoints

## Micro-Phases
- [ ] Add single agent + team endpoints
- [ ] Add pipeline run endpoint
- [ ] Add git + file endpoints
- [ ] Add webhook CRUD endpoints
- [ ] Add metrics endpoint
