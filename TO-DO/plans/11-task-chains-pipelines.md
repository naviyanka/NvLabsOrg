# Plan: Task Chains / Pipelines

## Priority: Strategic
## Effort: Large (1-2 weeks)
## Category: Agent Intelligence & Workflow

---

## Problem

Complex workflows require manual orchestration: "First design the API, then implement it, then write tests, then review." Users must wait for each step and manually trigger the next. The team lead delegates but can't define a fixed pipeline.

## Goal

Allow users to define multi-step task pipelines that execute sequentially or in parallel, automatically passing context between steps.

## Current State

- Team phases (create → design → execute → complete) provide a coarse pipeline
- Delegation router handles leader → worker task passing
- No user-definable pipeline system exists
- Tasks are one-shot (prompt → result)

## Proposed Solution

- Add a "Pipeline" concept: ordered list of steps
- Each step: { agent, prompt_template, depends_on?: step_id[], pass_context: boolean }
- Pipeline runner: watches for step completion, triggers next steps, injects previous results as context
- UI: pipeline builder (drag-drop steps) or YAML definition
- Store pipelines as files in the data directory

## Example Pipeline

```yaml
name: "Full Feature"
steps:
  - id: design
    agent: marcus
    prompt: "Design the architecture for: {{user_input}}"
  - id: implement
    agent: rex
    prompt: "Implement this design:\n{{design.result}}"
    depends_on: [design]
  - id: test
    agent: rex
    prompt: "Write tests for:\n{{implement.changed_files}}"
    depends_on: [implement]
  - id: review
    agent: sophie
    prompt: "Review these changes:\n{{implement.result}}"
    depends_on: [implement]
```

## Files to Create/Modify

1. `packages/orchestrator/src/pipeline.ts` — new pipeline runner
2. `packages/orchestrator/src/types.ts` — pipeline types
3. `packages/shared/src/commands.ts` — RunPipeline, SavePipeline commands
4. `apps/gateway/src/index.ts` — pipeline command handlers
5. `apps/web/src/components/office/ui/PipelineBuilder.tsx` — new UI
6. `apps/web/src/components/office/ui/PipelineView.tsx` — running pipeline visualization

## Micro-Phases

- [ ] Phase 1: Define pipeline schema (steps, dependencies, context passing)
- [ ] Phase 2: Create pipeline storage (save/load from data dir)
- [ ] Phase 3: Create pipeline runner (watch for completion, trigger next)
- [ ] Phase 4: Add RUN_PIPELINE command to gateway
- [ ] Phase 5: Create pipeline builder UI (step list with agent/prompt)
- [ ] Phase 6: Create running pipeline visualization (step status dots)
- [ ] Phase 7: Add context injection ({{prev.result}} template variables)
- [ ] Phase 8: Add parallel step support (steps with same depends_on)
- [ ] Phase 9: Test end-to-end with a real multi-step workflow

## Acceptance Criteria

- Users can define pipelines with multiple steps
- Steps execute in dependency order
- Previous step results are injected as context
- Pipeline progress is visible in the UI
- Failures halt the pipeline with clear error
- Pipelines are saved and reusable
