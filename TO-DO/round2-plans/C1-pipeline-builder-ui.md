# C1: Pipeline Builder UI

## Effort: 1 day
## Category: New Capabilities

---

## Problem
Pipelines can only be created via the REST API or by editing config.json manually. No visual builder exists.

## Solution
Create a PipelineBuilder modal/panel:
- Step list (add/remove/reorder)
- Per step: select agent role, write prompt template, set dependencies
- Save button → SAVE_PIPELINE command
- Run button → RUN_PIPELINE command
- Load existing pipelines from LIST_PIPELINES

## Files to Create/Modify
- `apps/web/src/components/office/ui/PipelineBuilder.tsx` — new component
- `apps/web/src/app/office/page.tsx` — add button/modal to open it

## Micro-Phases
- [ ] Create PipelineBuilder component with step list + add/remove
- [ ] Add role selector + prompt textarea per step
- [ ] Add dependency picker (dropdown of other step IDs)
- [ ] Wire save button → SAVE_PIPELINE
- [ ] Wire run button → RUN_PIPELINE with input field
- [ ] Add to office page (accessible from Dashboard or command palette)
