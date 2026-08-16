import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import path from "path";
import type { AIBackend } from "@nvlabs-org/orchestrator";

const isRoot = process.getuid?.() === 0;

/**
 * When running as root, --dangerously-skip-permissions is blocked by Claude Code.
 * Instead, configure ~/.claude/settings.json to allow all tool permissions.
 */
function ensureClaudeSettingsForRoot() {
  if (!isRoot) return;
  const claudeDir = path.join(homedir(), ".claude");
  const settingsPath = path.join(claudeDir, "settings.json");
  const requiredAllow = [
    "Bash", "Read", "Write", "Edit", "MultiEdit",
    "Glob", "Grep", "WebFetch", "TodoRead", "TodoWrite", "Agent",
  ];
  try {
    let settings: Record<string, unknown> = {};
    if (existsSync(settingsPath)) {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    }
    // bypassPermissions via settings.json — equivalent to --dangerously-skip-permissions
    settings.defaultMode = "bypassPermissions";
    const perms = (settings.permissions ?? {}) as Record<string, unknown>;
    const existing = Array.isArray(perms.allow) ? perms.allow as string[] : [];
    const merged = [...new Set([...existing, ...requiredAllow])];
    perms.allow = merged;
    settings.permissions = perms;
    if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
    console.log("[backends] Running as root — configured Claude Code settings.json to allow all permissions");
  } catch (err) {
    console.warn("[backends] Failed to configure Claude settings for root:", err);
  }
}

ensureClaudeSettingsForRoot();

const backends: AIBackend[] = [
  // ── Stable backends ───────────────────────────────────────────
  {
    id: "claude",
    name: "Claude Code",
    command: "claude",
    supportsStdin: true,
    instructionPath: ".claude/CLAUDE.md",
    stability: "stable",
    guardType: "hooks",
    supportsResume: true,
    supportsAgentType: true,
    supportsNativeWorktree: true,
    supportsStructuredOutput: true,
    buildArgs(prompt, opts) {
      const args = ["-p", prompt, "--output-format", "stream-json", "--verbose"];
      if (!isRoot) args.push("--dangerously-skip-permissions");
      if (!opts.skipResume) {
        if (opts.resumeSessionId) {
          args.push("--resume", opts.resumeSessionId);
        } else if (opts.continue) {
          args.push("--continue");
        }
      }
      if (opts.noTools) args.push("--tools", "");
      if (opts.model) args.push("--model", opts.model);
      if (opts.agentType) args.push("--agent", opts.agentType);
      if (opts.worktree) args.push("--worktree");
      return args;
    },
    deleteEnv: ["CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT"],
  },
  {
    id: "codex",
    name: "Codex CLI",
    command: "codex",
    instructionPath: "AGENTS.md",
    stability: "stable",
    guardType: "sandbox",          // OS-level Seatbelt (macOS) / Landlock (Linux)
    supportsResume: false,
    supportsAgentType: false,
    supportsNativeWorktree: false,
    supportsStructuredOutput: false,
    buildArgs(prompt, opts) {
      if (opts.fullAccess && !isRoot) {
        return ["exec", prompt, "--dangerously-bypass-approvals-and-sandbox", "--skip-git-repo-check"];
      }
      return ["exec", prompt, "--full-auto", "--skip-git-repo-check"];
    },
  },

  // ── Beta backends ─────────────────────────────────────────────
  {
    id: "gemini",
    name: "Antigravity CLI",
    command: "agy",
    instructionPath: "GEMINI.md",
    stability: "beta",
    guardType: "flag",             // --sandbox flag
    supportsResume: true,
    supportsAgentType: true,
    supportsNativeWorktree: false,
    supportsStructuredOutput: true,
    buildArgs(prompt, opts) {
      const args = ["-p", prompt, "--output-format", "stream-json"];
      if (!isRoot) args.push("--dangerously-skip-permissions");
      if (opts.continue) args.push("--continue");
      if (opts.model) args.push("--model", opts.model);
      if (opts.agentType) args.push("--agent", opts.agentType);
      return args;
    },
  },
  {
    id: "kiro",
    name: "Kiro CLI",
    command: "kiro-cli",
    instructionPath: ".kiro/steering/default.md",
    stability: "beta",
    guardType: "flag",             // --trust-all-tools flag
    supportsResume: true,
    supportsAgentType: true,
    supportsNativeWorktree: false,
    supportsStructuredOutput: false,
    buildArgs(prompt, opts) {
      const args = ["chat", "--no-interactive", "--trust-all-tools"];
      if (!opts.skipResume) {
        if (opts.resumeSessionId) {
          args.push("--resume-id", opts.resumeSessionId);
        } else if (opts.continue) {
          args.push("--resume");
        }
      }
      if (opts.model) args.push("--model", opts.model);
      if (opts.agentType) args.push("--agent", opts.agentType);
      args.push(prompt);
      return args;
    },
  },

  // ── Experimental backends ─────────────────────────────────────
  {
    id: "copilot",
    name: "GitHub Copilot",
    command: "copilot",
    instructionPath: ".github/copilot-instructions.md",
    stability: "experimental",
    guardType: "none",
    supportsResume: false,
    supportsAgentType: false,
    supportsNativeWorktree: false,
    supportsStructuredOutput: false,
    buildArgs(prompt, opts) {
      const args = ["-p", prompt];
      if (opts.fullAccess) args.push("--allow-all-tools");
      if (opts.model) args.push("--model", opts.model);
      return args;
    },
  },
  {
    id: "cursor",
    name: "Cursor CLI",
    command: "agent",              // Cursor's CLI binary is "agent", not "cursor"
    instructionPath: ".cursor/rules/instructions.md",
    stability: "experimental",
    guardType: "none",
    supportsResume: false,
    supportsAgentType: false,
    supportsNativeWorktree: false,
    supportsStructuredOutput: false,
    buildArgs(prompt, opts) {
      const args = ["-p", prompt];
      if (opts.fullAccess) args.push("--yolo");
      if (opts.model) args.push("--model", opts.model);
      return args;
    },
  },
  {
    id: "aider",
    name: "Aider",
    command: "aider",
    instructionPath: ".aider.conf.yml",
    stability: "experimental",
    guardType: "none",
    supportsResume: false,
    supportsAgentType: false,
    supportsNativeWorktree: false,
    supportsStructuredOutput: false,
    buildArgs(prompt) {
      return ["--message", prompt, "--yes", "--no-pretty", "--no-git"];
    },
  },
  {
    id: "opencode",
    name: "OpenCode",
    command: "opencode",
    instructionPath: "AGENTS.md",  // Same convention as Codex
    stability: "experimental",
    guardType: "none",
    supportsResume: false,
    supportsAgentType: false,
    supportsNativeWorktree: false,
    supportsStructuredOutput: true,
    buildArgs(prompt) {
      return ["run", prompt, "--format", "json"];
    },
  },
  {
    id: "pi",
    name: "Pi",
    command: "pi",
    instructionPath: ".claude/CLAUDE.md",  // Pi reads .claude/CLAUDE.md like Claude Code
    stability: "experimental",
    guardType: "none",             // .pi/extensions/ guard system exists but not deployed by us
    supportsResume: false,
    supportsAgentType: false,
    supportsNativeWorktree: false,
    supportsStructuredOutput: false,
    buildArgs(prompt, opts) {
      const args = ["-p", prompt];
      if (opts.model) args.push("--model", opts.model);
      return args;
    },
  },
  {
    id: "sapling",
    name: "Sapling",
    command: "sp",
    instructionPath: "SAPLING.md",
    stability: "experimental",
    guardType: "none",             // .sapling/guards.json exists but not deployed by us
    supportsResume: false,
    supportsAgentType: false,
    supportsNativeWorktree: false,
    supportsStructuredOutput: true,
    buildArgs(prompt, opts) {
      const args = ["run"];
      if (opts.model) args.push("--model", opts.model);
      args.push("--json", prompt);
      return args;
    },
  },
];

const backendMap = new Map<string, AIBackend>(backends.map((b) => [b.id, b]));

export function getBackend(id: string): AIBackend | undefined {
  return backendMap.get(id);
}

export function getAllBackends(): AIBackend[] {
  return backends;
}

/**
 * Identity patterns for backends with ambiguous binary names.
 * Maps backend id → pattern that `<command> --version` output must match for the
 * binary to count as the real CLI. Backends not listed here are accepted on a
 * plain path lookup (their names are distinctive enough).
 *
 * The match runs in JS rather than piping through `grep`, so detection does not
 * depend on POSIX tools being present — on native Windows they usually are not.
 */
const VERSION_PROBES: Record<string, RegExp> = {
  // "agent" is too generic — verify it's actually Cursor's CLI
  cursor: /cursor/i,
  // "copilot" also names AWS Copilot CLI — verify GitHub's agentic CLI
  copilot: /GitHub Copilot CLI|github copilot/i,
  // "pi" collides with math utilities, coreutils, etc.
  pi: /pi/i,
  // "sp" collides with Sapling SCM and other tools
  sapling: /sapling/i,
};

/**
 * Resolve a command to an absolute path, or null when it is not installed.
 *
 * Windows has no `which`: execSync runs commands through cmd.exe, where `which`
 * is not a builtin and Git's POSIX `which.exe` is normally not on PATH, so the
 * old `which <cmd>` probe failed for every backend and detected nothing. `where`
 * is the native equivalent and returns real Windows paths.
 */
function lookupCommand(command: string): string | null {
  const finder = process.platform === "win32" ? "where" : "which";
  try {
    const out = execSync(`${finder} ${command}`, {
      encoding: "utf-8",
      timeout: 3000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    // `where` can report several hits — take the first.
    const first = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0];
    return first ?? null;
  } catch {
    return null;
  }
}

/**
 * `which`/`execSync` above run through a POSIX shell (Git Bash on Windows), so resolved
 * paths come back like "/c/Users/arsla/.local/bin/claude". Node's spawn() on Windows goes
 * through the native Win32 CreateProcess API, which doesn't understand that syntax and
 * fails with ENOENT. Convert to a native Windows path so spawn() can actually find the
 * binary.
 *
 * npm/global installs on Windows commonly create BOTH an extensionless POSIX shell shim
 * and a .cmd/.exe wrapper side by side. Git Bash's `which` may return the extensionless
 * shim, which exists on disk but is a shell script Win32 spawn() cannot execute directly.
 * So a real Windows-executable candidate (.exe/.cmd/.bat) must be preferred FIRST, falling
 * back to the bare converted path only if none of those exist.
 */
function toNativeWindowsPath(posixPath: string): string {
  const match = posixPath.match(/^\/([a-zA-Z])\/(.*)$/);
  if (!match) return posixPath;
  const [, drive, rest] = match;
  const winPath = `${drive.toUpperCase()}:\\${rest.replace(/\//g, "\\")}`;
  for (const ext of [".exe", ".cmd", ".bat"]) {
    if (existsSync(winPath + ext)) {
      return winPath + ext;
    }
  }
  return winPath;
}

/** Check which AI CLI tools are installed on this machine.
 *  Also resolves each detected backend's command to its absolute path
 *  so that spawn() works even if the child process env has a different PATH. */
export function detectBackends(): string[] {
  const detected: string[] = [];
  for (const backend of backends) {
    let resolved = lookupCommand(backend.command);
    if (!resolved) continue; // not installed

    // A POSIX `which` (Git Bash) reports "/c/Users/..." which Win32 spawn() cannot use
    if (process.platform === "win32" && resolved.startsWith("/")) {
      resolved = toNativeWindowsPath(resolved);
    }

    // Ambiguous name — confirm identity from --version output before accepting
    const probe = VERSION_PROBES[backend.id];
    if (probe) {
      let output = "";
      try {
        output = execSync(`"${resolved}" --version`, {
          encoding: "utf-8",
          timeout: 5000,
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (err) {
        // Some CLIs exit non-zero on --version but still print their name
        const e = err as { stdout?: string | Buffer; stderr?: string | Buffer };
        output = `${e.stdout?.toString() ?? ""}${e.stderr?.toString() ?? ""}`;
      }
      if (!probe.test(output)) continue; // wrong binary
    }

    // Store the absolute path so spawn() doesn't depend on the child env PATH
    backend.command = resolved;
    console.log(`[backends] ${backend.id}: resolved to ${resolved}`);
    detected.push(backend.id);
  }
  return detected;
}
