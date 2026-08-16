# A3: Pipeline Completion Watcher

## Effort: 3 hours
## Category: Finish Half-Built

---

## Problem
The pipeline runner starts first steps (those with no dependencies) but never watches for their completion to trigger subsequent steps. Pipelines with multiple sequential steps only execute step 1.

## Solution
1. Track running pipelines in gateway state: `{ pipelineName, steps: Map<stepId, status> }`
2. Listen for TASK_DONE events that match running pipeline steps
3. When a step completes, check which dependent steps are now unblocked
4. For each unblocked step, inject previous results as `{{stepId.result}}` and dispatch

## Files to Modify
- `apps/gateway/src/index.ts` — add pipeline tracking state + event listener in forwardEvent
- `apps/gateway/src/config.ts` — export PipelineStep type if needed

## Micro-Phases
- [ ] Add activePipelines Map tracking step→agentId+taskId
- [ ] In RUN_PIPELINE, populate the tracking map
- [ ] In the forwardEvent listener, check TASK_DONE against pipeline steps
- [ ] When step completes: find unblocked dependents, inject context, dispatch
- [ ] Emit PIPELINE_PROGRESS events for UI
