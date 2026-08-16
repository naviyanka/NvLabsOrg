"use client";

import { useState, useEffect, useCallback } from "react";
import { sendCommand } from "@/lib/connection";
import { useOfficeStore } from "@/store/office-store";
import { nanoid } from "nanoid";
import TermModal from "./primitives/TermModal";
import TermButton from "./primitives/TermButton";
import TermInput from "./primitives/TermInput";

interface PipelineStep {
  id: string;
  agentRole: string;
  prompt: string;
  dependsOn: string[];
}

interface Pipeline {
  name: string;
  steps: PipelineStep[];
}

interface PipelineBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PipelineBuilder({ isOpen, onClose }: PipelineBuilderProps) {
  const agentDefs = useOfficeStore((s) => s.agentDefs);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [runInput, setRunInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // Load pipelines on open
  useEffect(() => {
    if (isOpen) {
      sendCommand({ type: "LIST_PIPELINES" });
    }
  }, [isOpen]);

  // Listen for PIPELINES_LOADED event via store subscription
  useEffect(() => {
    const unsub = useOfficeStore.subscribe((state, prev) => {
      // Check for pipeline-related raw events in the store isn't direct,
      // so we'll use a custom approach
    });
    return unsub;
  }, []);

  // Handle PIPELINES_LOADED via a custom event listener on window
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.pipelines) setPipelines(detail.pipelines);
    };
    window.addEventListener("pipelines-loaded", handler);
    return () => window.removeEventListener("pipelines-loaded", handler);
  }, []);

  // Also subscribe to raw store events — hook into handleEvent
  // Since the store doesn't expose pipelines directly, we'll fetch from the gateway event
  useEffect(() => {
    if (!isOpen) return;
    // Poll-style: listen to store changes that include pipelines
    const originalHandleEvent = useOfficeStore.getState().handleEvent;
    const patchedHandler = (event: any) => {
      if (event.type === "PIPELINES_LOADED") {
        setPipelines(event.pipelines ?? []);
      }
      originalHandleEvent(event);
    };
    useOfficeStore.setState({ handleEvent: patchedHandler });
    return () => {
      useOfficeStore.setState({ handleEvent: originalHandleEvent });
    };
  }, [isOpen]);

  const loadPipeline = (p: Pipeline) => {
    setSelectedPipeline(p.name);
    setName(p.name);
    setSteps(p.steps.map(s => ({ ...s, dependsOn: s.dependsOn ?? [] })));
  };

  const newPipeline = () => {
    setSelectedPipeline(null);
    setName("");
    setSteps([{ id: `step-${nanoid(4)}`, agentRole: "", prompt: "", dependsOn: [] }]);
  };

  const addStep = () => {
    setSteps(prev => [...prev, { id: `step-${nanoid(4)}`, agentRole: "", prompt: "", dependsOn: [] }]);
  };

  const removeStep = (idx: number) => {
    const removed = steps[idx];
    setSteps(prev => {
      const next = prev.filter((_, i) => i !== idx);
      // Remove from dependencies of other steps
      return next.map(s => ({
        ...s,
        dependsOn: s.dependsOn.filter(d => d !== removed.id),
      }));
    });
  };

  const updateStep = (idx: number, field: keyof PipelineStep, value: any) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const toggleDep = (stepIdx: number, depId: string) => {
    setSteps(prev => prev.map((s, i) => {
      if (i !== stepIdx) return s;
      const deps = s.dependsOn.includes(depId)
        ? s.dependsOn.filter(d => d !== depId)
        : [...s.dependsOn, depId];
      return { ...s, dependsOn: deps };
    }));
  };

  const handleSave = () => {
    if (!name.trim()) { setMessage("Name is required"); return; }
    if (steps.length === 0) { setMessage("Add at least one step"); return; }
    sendCommand({
      type: "SAVE_PIPELINE",
      name: name.trim(),
      steps: steps.map(s => ({
        id: s.id,
        agentRole: s.agentRole,
        prompt: s.prompt,
        dependsOn: s.dependsOn.length > 0 ? s.dependsOn : undefined,
      })),
    });
    setMessage("Saved!");
    setTimeout(() => setMessage(null), 2000);
  };

  const handleRun = () => {
    if (!name.trim()) { setMessage("Save the pipeline first"); return; }
    sendCommand({ type: "RUN_PIPELINE", name: name.trim(), input: runInput });
    setMessage("Pipeline started!");
    setTimeout(() => { setMessage(null); onClose(); }, 1500);
  };

  // Unique roles from agentDefs for the role selector
  const roles = [...new Set(agentDefs.map(d => d.role))].sort();

  return (
    <TermModal open={isOpen} onClose={onClose} maxWidth={640} zIndex={110} title="Pipeline Builder">
      <div className="flex gap-3 min-h-[400px]">
        {/* Left: pipeline list */}
        <div className="w-[140px] shrink-0 border-r border-[rgba(255,255,255,0.06)] pr-3 space-y-1">
          <TermButton variant="primary" size="sm" onClick={newPipeline} className="w-full mb-2">
            + New
          </TermButton>
          {pipelines.map((p) => (
            <button
              key={p.name}
              onClick={() => loadPipeline(p)}
              className={`w-full text-left text-[10px] font-mono px-2 py-1 rounded truncate transition-colors ${
                selectedPipeline === p.name
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted-foreground hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {p.name}
            </button>
          ))}
          {pipelines.length === 0 && (
            <div className="text-[9px] text-muted-foreground opacity-50 text-center py-4">No pipelines yet</div>
          )}
        </div>

        {/* Right: editor */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-3" data-scrollbar>
          {/* Pipeline name */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground shrink-0 w-12">Name</label>
            <TermInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-pipeline"
              className="flex-1"
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Steps ({steps.length})
              </span>
              <TermButton variant="dim" size="sm" onClick={addStep}>+ Step</TermButton>
            </div>

            {steps.map((step, idx) => (
              <div key={step.id} className="border border-[rgba(255,255,255,0.06)] rounded p-2 space-y-1.5 bg-black/10">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground font-mono shrink-0">{idx + 1}.</span>
                  <span className="text-[9px] text-muted-foreground opacity-50 font-mono">{step.id}</span>
                  <button
                    onClick={() => removeStep(idx)}
                    className="ml-auto text-[9px] text-muted-foreground hover:text-[#ef4444] transition-colors"
                    title="Remove step"
                  >✕</button>
                </div>

                {/* Role selector */}
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-muted-foreground shrink-0 w-10">Role</label>
                  <select
                    value={step.agentRole}
                    onChange={e => updateStep(idx, "agentRole", e.target.value)}
                    className="flex-1 bg-transparent border border-[rgba(255,255,255,0.1)] rounded px-2 py-0.5 text-[10px] text-foreground font-mono outline-none focus:border-accent"
                  >
                    <option value="" className="bg-[#111]">-- select role --</option>
                    {roles.map(r => (
                      <option key={r} value={r} className="bg-[#111]">{r}</option>
                    ))}
                    {/* Allow custom role typed in via the input */}
                  </select>
                  <TermInput
                    value={step.agentRole}
                    onChange={e => updateStep(idx, "agentRole", e.target.value)}
                    placeholder="or type custom"
                    className="w-[100px]"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="text-[9px] text-muted-foreground block mb-0.5">
                    Prompt <span className="opacity-50">({'{{input}}'}, {'{{stepId.result}}'})</span>
                  </label>
                  <textarea
                    value={step.prompt}
                    onChange={e => updateStep(idx, "prompt", e.target.value)}
                    placeholder="What should this step do..."
                    rows={2}
                    className="w-full bg-transparent border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-[10px] text-foreground font-mono resize-y outline-none focus:border-accent"
                  />
                </div>

                {/* Dependencies */}
                {idx > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-muted-foreground shrink-0">Depends on:</span>
                    {steps.slice(0, idx).map(prev => (
                      <button
                        key={prev.id}
                        onClick={() => toggleDep(idx, prev.id)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                          step.dependsOn.includes(prev.id)
                            ? "bg-accent/20 text-accent border border-accent/40"
                            : "bg-white/[0.03] text-muted-foreground border border-transparent hover:border-white/10"
                        }`}
                      >
                        {prev.id}
                      </button>
                    ))}
                    {idx === 1 && steps.length === 2 && (
                      <span className="text-[8px] text-muted-foreground opacity-40">none = runs in parallel</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {steps.length === 0 && (
              <div className="text-[10px] text-muted-foreground opacity-50 text-center py-4">
                Click "+ Step" to add pipeline steps
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <TermButton variant="primary" onClick={handleSave}>Save Pipeline</TermButton>
              <TermButton variant="dim" onClick={handleRun}>Run</TermButton>
              {message && (
                <span className="text-[10px] text-sem-green font-mono">{message}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-muted-foreground shrink-0">Input:</label>
              <TermInput
                value={runInput}
                onChange={e => setRunInput(e.target.value)}
                placeholder="Optional input for {{input}} placeholders"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </TermModal>
  );
}
