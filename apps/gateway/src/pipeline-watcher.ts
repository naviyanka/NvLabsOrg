/**
 * Pipeline Completion Watcher
 *
 * Tracks active pipelines, listens for step completions (TASK_DONE),
 * and auto-dispatches dependent steps whose prerequisites are all done.
 */

import type { PipelineStep } from "./config.js";

export type StepStatus = "pending" | "running" | "done" | "failed";

export interface ActiveStep {
  step: PipelineStep;
  status: StepStatus;
  agentId?: string;
  taskId?: string;
  result?: string;
}

export interface ActivePipeline {
  pipelineName: string;
  steps: Map<string, ActiveStep>; // stepId → ActiveStep
  userInput: string;
  workDir: string;
}

/** Callback invoked when a step becomes unblocked and should be dispatched */
export type DispatchFn = (pipeline: ActivePipeline, step: PipelineStep, prompt: string) => void;
/** Callback invoked on pipeline progress changes */
export type ProgressFn = (pipelineName: string, stepId: string, status: StepStatus, result?: string) => void;

const activePipelines: Map<string, ActivePipeline> = new Map();

/**
 * Register a new pipeline run for tracking.
 * Returns the pipeline key for future reference.
 */
export function registerPipeline(
  pipelineName: string,
  steps: PipelineStep[],
  userInput: string,
  workDir: string,
): string {
  const key = `${pipelineName}-${Date.now()}`;
  const stepMap = new Map<string, ActiveStep>();
  for (const step of steps) {
    const isRoot = !step.dependsOn || step.dependsOn.length === 0;
    stepMap.set(step.id, {
      step,
      status: isRoot ? "running" : "pending",
    });
  }
  activePipelines.set(key, { pipelineName, steps: stepMap, userInput, workDir });
  return key;
}

/**
 * Record that a specific step is now running with the given agentId/taskId.
 */
export function markStepRunning(pipelineKey: string, stepId: string, agentId: string, taskId: string): void {
  const pipeline = activePipelines.get(pipelineKey);
  if (!pipeline) return;
  const entry = pipeline.steps.get(stepId);
  if (entry) {
    entry.status = "running";
    entry.agentId = agentId;
    entry.taskId = taskId;
  }
}

/**
 * Look up which pipeline+step a task belongs to by agentId+taskId.
 * Returns null if the task is not part of any tracked pipeline.
 */
export function findPipelineStep(agentId: string, taskId: string): { pipelineKey: string; stepId: string } | null {
  for (const [pipelineKey, pipeline] of activePipelines) {
    for (const [stepId, entry] of pipeline.steps) {
      if (entry.agentId === agentId && entry.taskId === taskId) {
        return { pipelineKey, stepId };
      }
    }
  }
  return null;
}

/**
 * Handle a step completion. Marks the step done, injects results into dependent steps,
 * and dispatches any steps whose dependencies are now all satisfied.
 *
 * Returns list of newly unblocked steps (for the caller to dispatch).
 */
export function handleStepDone(
  pipelineKey: string,
  stepId: string,
  resultSummary: string,
  dispatch: DispatchFn,
  progress: ProgressFn,
): void {
  const pipeline = activePipelines.get(pipelineKey);
  if (!pipeline) return;

  const entry = pipeline.steps.get(stepId);
  if (!entry) return;

  // Mark as done
  entry.status = "done";
  entry.result = resultSummary;
  progress(pipeline.pipelineName, stepId, "done", resultSummary);

  // Check if entire pipeline is complete
  const allDone = [...pipeline.steps.values()].every(s => s.status === "done" || s.status === "failed");
  if (allDone) {
    console.log(`[Pipeline] "${pipeline.pipelineName}" completed (all steps done/failed)`);
    activePipelines.delete(pipelineKey);
    return;
  }

  // Find steps that are now unblocked
  for (const [candidateId, candidate] of pipeline.steps) {
    if (candidate.status !== "pending") continue;
    const deps = candidate.step.dependsOn ?? [];
    if (deps.length === 0) continue; // root steps already started

    // Check if ALL dependencies are done
    const allDepsDone = deps.every(depId => {
      const dep = pipeline.steps.get(depId);
      return dep?.status === "done";
    });

    if (allDepsDone) {
      // Inject previous step results into the prompt using {{stepId.result}} syntax
      let prompt = candidate.step.prompt;
      // Replace {{input}} with original user input
      prompt = prompt.replace(/\{\{input\}\}/g, pipeline.userInput);
      // Replace {{stepId.result}} with that step's result
      for (const depId of deps) {
        const dep = pipeline.steps.get(depId);
        const depResult = dep?.result ?? "";
        prompt = prompt.replace(new RegExp(`\\{\\{${depId}\\.result\\}\\}`, "g"), depResult);
      }
      // Also support generic {{previous.result}} for simple linear pipelines
      if (deps.length === 1) {
        const dep = pipeline.steps.get(deps[0]);
        prompt = prompt.replace(/\{\{previous\.result\}\}/g, dep?.result ?? "");
      }

      candidate.status = "running";
      progress(pipeline.pipelineName, candidateId, "running");
      dispatch(pipeline, candidate.step, prompt);
    }
  }
}

/**
 * Handle a step failure. Marks the step and any dependent steps as failed.
 */
export function handleStepFailed(
  pipelineKey: string,
  stepId: string,
  error: string,
  progress: ProgressFn,
): void {
  const pipeline = activePipelines.get(pipelineKey);
  if (!pipeline) return;

  const entry = pipeline.steps.get(stepId);
  if (!entry) return;

  entry.status = "failed";
  entry.result = error;
  progress(pipeline.pipelineName, stepId, "failed", error);

  // Cascade failure: mark all transitive dependents as failed
  const failed = new Set<string>([stepId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [candidateId, candidate] of pipeline.steps) {
      if (candidate.status !== "pending") continue;
      const deps = candidate.step.dependsOn ?? [];
      if (deps.some(d => failed.has(d))) {
        candidate.status = "failed";
        candidate.result = `Upstream step "${stepId}" failed`;
        failed.add(candidateId);
        progress(pipeline.pipelineName, candidateId, "failed", candidate.result);
        changed = true;
      }
    }
  }

  // Check if pipeline is complete
  const allDone = [...pipeline.steps.values()].every(s => s.status === "done" || s.status === "failed");
  if (allDone) {
    console.log(`[Pipeline] "${pipeline.pipelineName}" completed (some steps failed)`);
    activePipelines.delete(pipelineKey);
  }
}

/** Get all active pipelines (for debugging/metrics) */
export function getActivePipelines(): Map<string, ActivePipeline> {
  return activePipelines;
}
