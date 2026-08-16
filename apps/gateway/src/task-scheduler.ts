/**
 * Task Scheduler — runs tasks at fixed intervals (cron-lite).
 * Schedules are persisted to disk and restored on gateway restart.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { nanoid } from "nanoid";
import { CONFIG_DIR } from "./config.js";

export interface ScheduledTask {
  id: string;
  /** Human-readable name */
  name: string;
  /** Agent ID to run the task on (must exist at execution time) */
  agentId: string;
  /** Task prompt */
  prompt: string;
  /** Interval in minutes between executions */
  intervalMinutes: number;
  /** Working directory (optional) */
  workDir?: string;
  /** Whether the schedule is active */
  enabled: boolean;
  /** Timestamp of last execution (ms) */
  lastRunAt: number | null;
  /** Timestamp of next scheduled execution (ms) */
  nextRunAt: number;
  /** Number of times executed */
  runCount: number;
  /** Created at timestamp */
  createdAt: number;
}

type RunCallback = (schedule: ScheduledTask) => void;

const SCHEDULES_FILE = resolve(CONFIG_DIR, "schedules.json");
let schedules: ScheduledTask[] = [];
let timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
let runCallback: RunCallback | null = null;

/** Load persisted schedules from disk */
function loadSchedules(): ScheduledTask[] {
  try {
    if (existsSync(SCHEDULES_FILE)) {
      return JSON.parse(readFileSync(SCHEDULES_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("[Scheduler] Failed to load schedules:", e);
  }
  return [];
}

/** Persist schedules to disk */
function saveSchedules() {
  try {
    const dir = resolve(CONFIG_DIR);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), "utf-8");
  } catch (e) {
    console.error("[Scheduler] Failed to save schedules:", e);
  }
}

/** Schedule the next timer for a task */
function scheduleTimer(task: ScheduledTask) {
  // Clear existing timer
  const existing = timers.get(task.id);
  if (existing) clearTimeout(existing);

  if (!task.enabled) return;

  const now = Date.now();
  const delay = Math.max(0, task.nextRunAt - now);

  const timer = setTimeout(() => {
    executeScheduledTask(task.id);
  }, delay);

  timers.set(task.id, timer);
  console.log(`[Scheduler] "${task.name}" next run in ${Math.round(delay / 1000)}s`);
}

/** Execute a scheduled task and reschedule */
function executeScheduledTask(id: string) {
  const task = schedules.find(s => s.id === id);
  if (!task || !task.enabled) return;

  console.log(`[Scheduler] Executing "${task.name}" (run #${task.runCount + 1})`);

  // Update state
  task.lastRunAt = Date.now();
  task.runCount++;
  task.nextRunAt = Date.now() + task.intervalMinutes * 60 * 1000;
  saveSchedules();

  // Execute via callback
  if (runCallback) {
    runCallback(task);
  }

  // Schedule next run
  scheduleTimer(task);
}

/**
 * Initialize the scheduler. Call once at gateway startup.
 * @param callback Called when a scheduled task fires — should dispatch RUN_TASK.
 */
export function initScheduler(callback: RunCallback) {
  runCallback = callback;
  schedules = loadSchedules();

  // Start timers for all enabled schedules
  const now = Date.now();
  for (const task of schedules) {
    if (!task.enabled) continue;
    // If nextRunAt is in the past (gateway was offline), run soon
    if (task.nextRunAt < now) {
      task.nextRunAt = now + 5000; // run in 5s
    }
    scheduleTimer(task);
  }

  console.log(`[Scheduler] Loaded ${schedules.length} schedule(s), ${schedules.filter(s => s.enabled).length} active`);
}

/** Create a new scheduled task */
export function createSchedule(opts: {
  name: string;
  agentId: string;
  prompt: string;
  intervalMinutes: number;
  workDir?: string;
}): ScheduledTask {
  const now = Date.now();
  const task: ScheduledTask = {
    id: `sched-${nanoid(6)}`,
    name: opts.name,
    agentId: opts.agentId,
    prompt: opts.prompt,
    intervalMinutes: opts.intervalMinutes,
    workDir: opts.workDir,
    enabled: true,
    lastRunAt: null,
    nextRunAt: now + opts.intervalMinutes * 60 * 1000,
    runCount: 0,
    createdAt: now,
  };
  schedules.push(task);
  saveSchedules();
  scheduleTimer(task);
  console.log(`[Scheduler] Created "${task.name}" — every ${task.intervalMinutes}min`);
  return task;
}

/** Delete a scheduled task */
export function deleteSchedule(id: string): boolean {
  const idx = schedules.findIndex(s => s.id === id);
  if (idx === -1) return false;
  const timer = timers.get(id);
  if (timer) { clearTimeout(timer); timers.delete(id); }
  schedules.splice(idx, 1);
  saveSchedules();
  return true;
}

/** Toggle a schedule on/off */
export function toggleSchedule(id: string): ScheduledTask | null {
  const task = schedules.find(s => s.id === id);
  if (!task) return null;
  task.enabled = !task.enabled;
  if (task.enabled) {
    task.nextRunAt = Date.now() + task.intervalMinutes * 60 * 1000;
    scheduleTimer(task);
  } else {
    const timer = timers.get(id);
    if (timer) { clearTimeout(timer); timers.delete(id); }
  }
  saveSchedules();
  return task;
}

/** Get all schedules */
export function getSchedules(): ScheduledTask[] {
  return [...schedules];
}

/** Stop all timers (for graceful shutdown) */
export function destroyScheduler() {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}
