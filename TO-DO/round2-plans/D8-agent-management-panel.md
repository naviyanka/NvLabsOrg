# D8: Agent Management Panel

## Effort: 2-3 days
## Category: New Capability (Strategic)

---

## Problem
There's no dedicated place to manage individual agents. Agent configuration, skills, memory, history, and performance data are scattered across different parts of the UI or only accessible via config files. Users need a single panel where they can:
- View an agent's full profile (name, role, backend, skills, personality)
- See detailed token/cost usage and task history
- Manage skill files (view, add, remove, upload .md files)
- Inspect agent memory (what the agent has learned, session history)
- Perform agent actions (fire, change backend, clear memory, reassign)

## Solution
Create an **Agent Management Panel** — a modal/drawer that opens when you click "Manage" on an agent (from context menu, dashboard, or agent pane header). It has tabs:

1. **Profile** — Name, role, personality, backend, palette, skillFiles list
2. **Performance** — Token usage breakdown, task count, success/fail rate, cost estimate, task duration history
3. **Skills** — List of attached skill files with content preview, add/remove skills, upload new .md files
4. **Memory** — Agent facts (L2), session history (L1), shared knowledge (L3), with option to clear
5. **History** — Full task history with timestamps, prompts, results, duration

## Commands/Events Needed

### New Commands
- `GET_AGENT_DETAILS` — Returns full agent profile + memory + skills content
- `GET_AGENT_MEMORY` — Returns agent's L1/L2/L3 memory data
- `UPLOAD_SKILL` — Upload a new skill .md file (name + content)
- `DELETE_SKILL` — Remove a skill file
- `ATTACH_SKILL` — Add a skill to an agent's skillFiles list
- `DETACH_SKILL` — Remove a skill from an agent's skillFiles list

### New Events
- `AGENT_DETAILS_LOADED` — Full agent details response
- `AGENT_MEMORY_LOADED` — Memory data for an agent
- `SKILL_UPLOADED` — Confirmation + updated skill list

## Files to Create/Modify

### New Files
- `apps/web/src/components/office/ui/AgentManagementPanel.tsx` — Main panel component with tabs
- `apps/web/src/components/office/ui/AgentSkillsTab.tsx` — Skills management tab
- `apps/web/src/components/office/ui/AgentMemoryTab.tsx` — Memory inspection tab
- `apps/web/src/components/office/ui/AgentPerformanceTab.tsx` — Performance/cost tab
- `apps/web/src/components/office/ui/AgentHistoryTab.tsx` — Task history tab

### Modified Files
- `packages/shared/src/commands.ts` — Add new commands
- `packages/shared/src/events.ts` — Add new events
- `apps/gateway/src/index.ts` — Add command handlers
- `apps/web/src/store/office-store.ts` — Add state for agent details
- `apps/web/src/app/office/page.tsx` — Wire up panel opening
- `apps/web/src/components/office/ui/AgentContextMenu.tsx` — Add "Manage" action
- `apps/web/src/components/office/ui/AgentPane.tsx` — Add "Manage" button in header

---

## Micro-Phases

### Phase 1: Gateway API (2h)
- [ ] Add `GET_AGENT_DETAILS` command schema + handler (returns profile + metrics + skill file names)
- [ ] Add `GET_AGENT_MEMORY` command schema + handler (reads memory files, returns L1/L2/L3 data)
- [ ] Add `UPLOAD_SKILL` command schema + handler (saves .md file to skills dir)
- [ ] Add `DELETE_SKILL` command schema + handler
- [ ] Add `ATTACH_SKILL` / `DETACH_SKILL` handlers (update agent def's skillFiles array)
- [ ] Add corresponding events to shared schemas
- [ ] Gateway typecheck passes

### Phase 2: Panel Shell + Profile Tab (2h)
- [ ] Create `AgentManagementPanel.tsx` with tabbed layout (Profile, Performance, Skills, Memory, History)
- [ ] Implement Profile tab: show/edit name, role, personality, backend, palette
- [ ] Wire panel opening from AgentPane header (gear icon) and context menu ("Manage Agent")
- [ ] Add panel state to office page + dynamic import
- [ ] Web build passes

### Phase 3: Performance Tab (1h)
- [ ] Create `AgentPerformanceTab.tsx`
- [ ] Show: total tokens in/out, estimated cost, task count, success rate
- [ ] Show: average task duration, last task timestamp
- [ ] Pull data from store's metricsData + agent's tokenUsage

### Phase 4: Skills Tab (2h)
- [ ] Create `AgentSkillsTab.tsx`
- [ ] List agent's current skills with content preview (collapsible)
- [ ] "Attach Skill" — dropdown of available skills from LIST_SKILLS
- [ ] "Detach Skill" — remove button per skill
- [ ] "Upload New Skill" — file picker for .md files, reads content, sends UPLOAD_SKILL
- [ ] Refresh skill list after add/remove

### Phase 5: Memory Tab (2h)
- [ ] Create `AgentMemoryTab.tsx`
- [ ] Display L1 session history (list of past sessions with summaries)
- [ ] Display L2 agent facts (learned patterns, preferences)
- [ ] Display L3 shared knowledge (cross-agent facts)
- [ ] "Clear Agent Memory" button per agent (not global)
- [ ] "Export Memory" as JSON download

### Phase 6: History Tab (1h)
- [ ] Create `AgentHistoryTab.tsx`
- [ ] Show full task history: timestamp, prompt (truncated), result summary, duration, status
- [ ] Clickable entries to expand full prompt/result
- [ ] Filter by status (all/success/failed)

### Phase 7: Integration + Polish (1h)
- [ ] Add "Manage" to agent context menu
- [ ] Add manage button to AgentPane header
- [ ] Add manage action to Dashboard agent list
- [ ] Ensure panel works in both office and console modes
- [ ] Mobile responsive layout for the panel
- [ ] Final build verification

---

## Data Flow

```
User clicks "Manage Agent"
    → Opens AgentManagementPanel with agentId
    → Sends GET_AGENT_DETAILS (agentId)
    → Gateway responds with AGENT_DETAILS_LOADED:
        {
          agentId, name, role, backend, personality, palette,
          skillFiles: ["tdd", "react-patterns"],
          metrics: { taskCount, successCount, failCount, totalInput, totalOutput, avgDuration },
          skills: [{ name, title, content }],  // actual file contents
        }
    → User clicks "Memory" tab
    → Sends GET_AGENT_MEMORY (agentId)
    → Gateway responds with AGENT_MEMORY_LOADED:
        {
          sessionHistory: [...],  // L1
          agentFacts: [...],      // L2
          sharedKnowledge: [...], // L3
        }
```

## Notes
- Skills are .md files stored in `~/.nvlabs-org/skills/` (already supported)
- Memory is stored in `~/.nvlabs-org/data/memory/` per agent
- Metrics are already tracked by the orchestrator
- The panel should work for both solo agents and team members
