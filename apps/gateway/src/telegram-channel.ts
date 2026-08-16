import TelegramBot from "node-telegram-bot-api";
import { config } from "./config.js";
import { nanoid } from "nanoid";
import { execSync } from "child_process";
import { DEFAULT_AGENT_DEFS, type AgentDefinition } from "@office/shared";
import type { GatewayEvent, Command } from "@office/shared";
import type { Channel, CommandMeta } from "./transport.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let bot: TelegramBot | null = null;
let commandHandler: ((cmd: Command, meta: CommandMeta) => void) | null = null;

/** TG message ID -> agentId (anchors + status messages) */
const replyToAgent = new Map<number, string>();

/** "chatId:agentId" -> anchor message ID */
const anchorMessages = new Map<string, number>();

/** "chatId:agentId" -> editable status message ID */
const statusMessages = new Map<string, number>();

/** All chat IDs that have interacted with the bot */
const activeChatIds = new Set<number>();

/** "chatId:userId" -> agentId sticky session (set by /alex, /eli, etc.) */
const stickyAgent = new Map<string, string>();

/** Allowed TG user IDs (empty = allow all) */
let allowedUsers: string[] = [];
let isInitialConnect = false;

/** Live hired agents — synced from gateway via syncTelegramHiredAgents() */
let hiredAgents: AgentMenuItem[] = [];

/** All agent definitions (fallback for name/role/personality lookup) */
let allAgentDefs: AgentDefinition[] = [];

// --- Live streaming state ---
/** "chatId:agentId" -> accumulated stream text */
const streamBuffers = new Map<string, string>();
/** "chatId:agentId" -> throttle timer */
const streamTimers = new Map<string, NodeJS.Timeout>();
const STREAM_THROTTLE_MS = 3000;

// --- Task history ---
interface TaskHistoryEntry {
  agentName: string;
  agentId: string;
  summary: string;
  durationMs?: number;
  timestamp: number;
  changedFiles: string[];
  previewUrl: string;
}
const taskHistory: TaskHistoryEntry[] = [];
const MAX_HISTORY = 20;

// --- Last task results (per agent) ---
const lastTaskResults = new Map<string, { summary: string; changedFiles: string[]; previewUrl: string; prompt: string; lastError?: string }>();

// --- Proactive notifications ---
const mutedChats = new Set<number>();

// --- Project / workspace ---
let telegramWorkDir: string | undefined;

// --- Detected backends (updated from broadcast) ---
let detectedBackends: string[] = [];

// --- Current team ID (tracked from AGENT_CREATED/TEAM_PHASE broadcasts) ---
let currentTeamId: string | undefined;

// --- Per-agent model override ---
const agentModelOverride = new Map<string, string>();

// ---------------------------------------------------------------------------
// Agent menu (only hired agents; falls back to all defs if none hired)
// ---------------------------------------------------------------------------

interface AgentMenuItem {
  id: string;
  name: string;
  role: string;
  personality: string;
}

function buildAgentMenu(): AgentMenuItem[] {
  return hiredAgents.length > 0 ? hiredAgents : allAgentDefs.map((d) => ({
    id: d.id,
    name: d.name,
    role: d.role,
    personality: d.personality,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** TG command -> agentId mapping (commands must be [a-z0-9_], 1-32 chars) */
const cmdToAgentId = new Map<string, string>();

function shortRole(role: string): string {
  return role.split(" — ")[0];
}

function toTgCommand(agent: AgentMenuItem): string {
  if (/^[a-z][a-z0-9_]{0,31}$/.test(agent.id)) return agent.id;
  const fromName = agent.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (fromName.length > 0 && fromName.length <= 32) return fromName;
  return ("a" + agent.id.replace(/[^a-z0-9]/gi, "").toLowerCase()).slice(0, 32);
}

function tgMeta(): CommandMeta {
  return { role: "owner", clientId: "telegram" };
}

/** Truncate text to Telegram's 4096 char limit */
function tgTruncate(text: string, max = 4000): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n… (truncated)";
}

function buildTunnelPreviewLink(result: any): string {
  if (!config.tunnelBaseUrl || !result) return "";
  const base = config.tunnelBaseUrl;
  const url: string | undefined = result.previewUrl;
  if (url) {
    if (url.includes("localhost:9199") || url.includes("127.0.0.1:9199")) {
      return url.replace(/https?:\/\/(?:localhost|127\.0\.0\.1):9199/, `${base}/preview-static`);
    }
    if (url.includes("localhost:9198") || url.includes("127.0.0.1:9198")) {
      return url.replace(/https?:\/\/(?:localhost|127\.0\.0\.1):9198/, `${base}/preview-app`);
    }
    return "";
  }
  const fileName = result.previewPath?.split("/").pop()
    ?? (result.entryFile && /\.html?$/i.test(result.entryFile) ? result.entryFile.split("/").pop() : null);
  if (fileName) return `${base}/preview-static/${fileName}`;
  if (result.previewCmd && result.previewPort) return `${base}/preview-app`;
  return "";
}

function resolveAgentFromReply(msg: TelegramBot.Message): string | null {
  const replyId = msg.reply_to_message?.message_id;
  if (!replyId) return null;
  return replyToAgent.get(replyId) ?? null;
}

function anchorKey(chatId: number, agentId: string): string {
  return `${chatId}:${agentId}`;
}

function evictIfNeeded<K, V>(map: Map<K, V>, limit = 2000) {
  if (map.size <= limit) return;
  const it = map.keys();
  for (let i = 0; i < map.size - limit; i++) {
    const k = it.next().value;
    if (k !== undefined) map.delete(k);
  }
}

/** Find an agent by name (case-insensitive partial match) */
function findAgentByName(name: string): AgentMenuItem | undefined {
  const lower = name.toLowerCase().trim();
  const menu = buildAgentMenu();
  return menu.find(a => a.name.toLowerCase() === lower)
    ?? menu.find(a => a.name.toLowerCase().startsWith(lower));
}

/** Find a matching agent definition by role keyword */
function findDefByRole(keyword: string): AgentDefinition | undefined {
  const lower = keyword.toLowerCase().trim();
  return DEFAULT_AGENT_DEFS.find(d =>
    d.role.toLowerCase().includes(lower) || d.skills.toLowerCase().includes(lower) || d.name.toLowerCase() === lower
  );
}

// ---------------------------------------------------------------------------
// Exported API
// ---------------------------------------------------------------------------

export function setTelegramAgentDefs(defs: AgentDefinition[]) {
  allAgentDefs = defs;
}

export function syncTelegramHiredAgents(agents: { agentId: string; name: string; role: string; personality?: string }[]) {
  hiredAgents = agents.map((a) => ({
    id: a.agentId,
    name: a.name,
    role: a.role,
    personality: a.personality ?? "",
  }));
  rebuildBotCommands();
}

// ---------------------------------------------------------------------------
// Bot commands menu
// ---------------------------------------------------------------------------

function rebuildBotCommands() {
  if (!bot) return;
  const menu = buildAgentMenu();
  cmdToAgentId.clear();
  const seen = new Set<string>();
  const commands: { command: string; description: string }[] = [];
  for (const a of menu) {
    let cmd = toTgCommand(a);
    if (seen.has(cmd)) {
      let i = 2;
      while (seen.has(`${cmd.slice(0, 30)}${i}`)) i++;
      cmd = `${cmd.slice(0, 30)}${i}`.slice(0, 32);
    }
    seen.add(cmd);
    cmdToAgentId.set(cmd, a.id);
    commands.push({ command: cmd, description: `${a.name} - ${shortRole(a.role)}`.slice(0, 256) });
  }
  // Add utility commands
  commands.push(
    { command: "team", description: "Show current team" },
    { command: "hire", description: "Hire an agent (e.g. /hire frontend)" },
    { command: "hireteam", description: "Hire full team (Lead+Dev+Reviewer)" },
    { command: "fire", description: "Fire current agent" },
    { command: "cancel", description: "Cancel current task" },
    { command: "queue", description: "Show task queue" },
    { command: "retry", description: "Retry last task" },
    { command: "history", description: "Recent task results" },
    { command: "help", description: "Show all commands" },
  );
  bot.setMyCommands(commands.slice(0, 100)).catch((err: Error) => {
    console.error("[Telegram] Failed to update bot commands:", err.message);
  });
}

// ---------------------------------------------------------------------------
// Channel implementation
// ---------------------------------------------------------------------------

export const telegramChannel: Channel = {
  name: "Telegram",

  async init(handler: (cmd: Command, meta: CommandMeta) => void): Promise<boolean> {
    const token = config.telegramBotToken;
    if (!token) return false;

    commandHandler = handler;
    allowedUsers = config.telegramAllowedUsers ?? [];
    isInitialConnect = true;
    bot = new TelegramBot(token, { polling: true });

    bot.on("polling_error", async (err: any) => {
      const code = err?.response?.statusCode ?? err?.code;
      if (code === 409) {
        if (!isInitialConnect) {
          console.warn("[Telegram] 409 Conflict: another instance took over. Yielding.");
          bot?.stopPolling();
          return;
        }
        isInitialConnect = false;
        console.warn("[Telegram] 409 Conflict: taking over from old instance...");
        bot?.stopPolling();
        try {
          await bot?.deleteWebHook();
          await new Promise(r => setTimeout(r, 1500));
          await bot?.startPolling();
          rebuildBotCommands();
          console.log("[Telegram] Took over polling successfully.");
        } catch (retryErr: any) {
          console.error("[Telegram] Failed to take over:", retryErr.message ?? retryErr);
        }
        return;
      }
      console.error("[Telegram] Polling error:", err.message ?? err);
    });

    rebuildBotCommands();

    // getMe can fail on transient network issues — retry a few times
    let botInfo: TelegramBot.User;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        botInfo = await bot.getMe();
        break;
      } catch (err: any) {
        console.error(`[Telegram] getMe failed (attempt ${attempt}/3):`, err.message ?? err);
        if (attempt === 3) {
          console.error("[Telegram] Could not reach Telegram API after 3 attempts. Channel disabled.");
          bot.stopPolling();
          bot = null;
          return false;
        }
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    isInitialConnect = false;
    const agentMenu = buildAgentMenu();
    console.log(`[Telegram] @${botInfo!.username} ready (single-bot mode, ${agentMenu.length} agents)`);

    // ----- Callback query handler (inline buttons) -----
    bot.on("callback_query", (query) => {
      if (!query.data || !query.message) return;
      const chatId = query.message.chat.id;
      activeChatIds.add(chatId);
      const data = query.data;

      // Approval buttons
      if (data.startsWith("approve:") || data.startsWith("reject:")) {
        const [action, approvalId] = data.split(":");
        const decision = action === "approve" ? "yes" : "no";
        handler({ type: "APPROVAL_DECISION", approvalId: approvalId || "__all__", decision: decision as "yes" | "no" }, tgMeta());
        bot!.answerCallbackQuery(query.id, { text: `${action === "approve" ? "Approved" : "Rejected"}` }).catch(() => {});
        bot!.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }).catch(() => {});
        return;
      }

      // Retry button
      if (data.startsWith("retry:")) {
        const agentId = data.slice(6);
        const last = lastTaskResults.get(agentId);
        if (last && commandHandler) {
          const taskId = nanoid();
          commandHandler({ type: "RUN_TASK", agentId, taskId, prompt: last.prompt }, tgMeta());
          bot!.answerCallbackQuery(query.id, { text: "Retrying..." }).catch(() => {});
        } else {
          bot!.answerCallbackQuery(query.id, { text: "No previous task to retry" }).catch(() => {});
        }
        return;
      }

      // Files button
      if (data.startsWith("files:")) {
        const agentId = data.slice(6);
        const last = lastTaskResults.get(agentId);
        if (last?.changedFiles.length) {
          const fileList = last.changedFiles.map(f => `• ${f}`).join("\n");
          bot!.sendMessage(chatId, tgTruncate(`Changed files:\n${fileList}`)).catch(() => {});
        } else {
          bot!.sendMessage(chatId, "No files changed in the last task.").catch(() => {});
        }
        bot!.answerCallbackQuery(query.id).catch(() => {});
        return;
      }

      // Diff button
      if (data === "diff") {
        handleDiffCommand(chatId);
        bot!.answerCallbackQuery(query.id).catch(() => {});
        return;
      }

      bot!.answerCallbackQuery(query.id).catch(() => {});
    });

    // ----- Message handler -----
    bot.on("message", (msg) => {
      if (!msg.text || !msg.from) return;
      if (allowedUsers.length > 0 && !allowedUsers.includes(String(msg.from.id))) return;

      activeChatIds.add(msg.chat.id);
      const text = msg.text.trim();
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const currentMenu = buildAgentMenu();

      // =====================================================================
      // COMMAND ROUTING
      // =====================================================================

      // --- /start ---
      if (text === "/start" || text === `/start@${botInfo.username}`) {
        rebuildBotCommands();
        const lines: string[] = [];
        for (const [cmd, agentId] of cmdToAgentId) {
          const a = currentMenu.find((m) => m.id === agentId);
          if (a) lines.push(`/${cmd} - ${a.name} (${shortRole(a.role)})`);
        }
        bot!.sendMessage(chatId,
          `Welcome to NVLabs Org!\n\nAvailable agents:\n${lines.join("\n")}\n\nType /help for all commands.`,
        ).catch(() => {});
        return;
      }

      // --- /help ---
      if (text === "/help" || text === `/help@${botInfo.username}`) {
        bot!.sendMessage(chatId, [
          "📋 <b>Agent Commands</b>",
          "/team — Show current team",
          "/hire &lt;role&gt; — Hire solo agent",
          "/hireteam — Hire full team (Lead+Dev+Reviewer)",
          "/hireteam &lt;role&gt; — Add agent to existing team",
          "/fire — Fire current agent",
          "/switch &lt;backend&gt; — Change backend",
          "",
          "🔧 <b>Task Commands</b>",
          "/cancel — Cancel current task",
          "/retry — Retry last task",
          "/queue — Show task queue",
          "/history — Recent results",
          "",
          "📂 <b>Project</b>",
          "/project &lt;path&gt; — Set working directory",
          "/projects — List saved projects",
          "/git — Show git status",
          "",
          "👥 <b>Multi-Agent</b>",
          "/broadcast &lt;msg&gt; — Send to all agents",
          "/ask &lt;name&gt; &lt;msg&gt; — Quick one-shot",
          "/delegate &lt;name&gt; &lt;task&gt; — Route to agent",
          "",
          "🔔 <b>Notifications</b>",
          "/mute — Mute background notifications",
          "/unmute — Unmute notifications",
          "",
          "📄 <b>Files & Preview</b>",
          "/diff — Last git diff",
          "/preview — Preview link",
          "/files — Changed files",
          "",
          "⚙️ <b>Config</b>",
          "/backends — Show AI backends",
          "/model &lt;name&gt; — Set model for agent",
          "/status — Refresh agent statuses",
        ].join("\n"), { parse_mode: "HTML" }).catch(() => {});
        return;
      }

      // --- /team ---
      if (text === "/team" || text === `/team@${botInfo.username}`) {
        if (currentMenu.length === 0) {
          bot!.sendMessage(chatId, "No agents hired. Use /hire to add one.").catch(() => {});
        } else {
          const lines = currentMenu.map(a => {
            const sticky = stickyAgent.get(`${chatId}:${userId}`) === a.id ? " ◀" : "";
            const lastResult = lastTaskResults.get(a.id);
            const statusIcon = statusMessages.has(anchorKey(chatId, a.id)) ? "🔄" : "💤";
            return `${statusIcon} <b>${a.name}</b> — ${shortRole(a.role)}${sticky}`;
          });
          bot!.sendMessage(chatId, `Team (${currentMenu.length}):\n${lines.join("\n")}\n\n🔄 = working, 💤 = idle, ◀ = selected`, { parse_mode: "HTML" }).catch(() => {});
        }
        return;
      }

      // --- /hire <role> — hire a solo agent ---
      if (text.startsWith("/hire") && !text.startsWith("/hireteam")) {
        const roleKeyword = text.slice(5).trim();
        if (!roleKeyword) {
          const available = DEFAULT_AGENT_DEFS.filter(d => d.teamRole === "dev").map(d => `• ${d.name} — ${d.role}`).join("\n");
          bot!.sendMessage(chatId, `Usage: /hire <role>\nHires a solo agent.\n\nFor team: /hireteam <role>\n\nAvailable:\n${available}`).catch(() => {});
          return;
        }
        const def = findDefByRole(roleKeyword);
        if (!def) {
          bot!.sendMessage(chatId, `No agent found matching "${roleKeyword}". Try: frontend, backend, prototyper, designer, product`).catch(() => {});
          return;
        }
        const agentId = `agent-${nanoid(6)}`;
        handler({
          type: "CREATE_AGENT",
          agentId,
          name: def.name,
          role: `${def.role} — ${def.skills}`,
          palette: def.palette,
          personality: def.personality,
          backend: config.defaultBackend,
          workDir: telegramWorkDir,
        }, tgMeta());
        // Trigger PING so web UI immediately picks up the new agent
        setTimeout(() => handler({ type: "PING" }, tgMeta()), 500);
        bot!.sendMessage(chatId, `Hired ${def.name} (${def.role}) solo\nID: ${agentId}`).catch(() => {});
        stickyAgent.set(`${chatId}:${userId}`, agentId);
        return;
      }

      // --- /hireteam [role] — hire full team OR add agent to existing team ---
      if (text.startsWith("/hireteam")) {
        const arg = text.slice(9).trim();

        if (!arg) {
          // No argument: hire the full default team
          const workDir = telegramWorkDir;
          handler({
            type: "CREATE_TEAM",
            leadId: "marcus",
            memberIds: ["rex", "sophie"],
            backends: {},
            workDir,
          }, tgMeta());
          setTimeout(() => handler({ type: "PING" }, tgMeta()), 1000);
          bot!.sendMessage(chatId, `Team hired: Marcus (Lead) + Rex (Dev) + Sophie (Reviewer)${workDir ? `\nWorkDir: ${workDir}` : ""}\n\nAdd more with /hireteam <role>`).catch(() => {});
          return;
        }

        // Argument provided: check if it's a saved template name first
        const templates = (config as any).teamTemplates as Array<{ name: string; members: { defId: string; backend?: string }[]; workDir?: string }> | undefined;
        const template = templates?.find(t => t.name.toLowerCase() === arg.toLowerCase());
        if (template) {
          // Load from template
          const leadMember = template.members.find(m => m.defId === "marcus") ? "marcus" : template.members[0]?.defId ?? "marcus";
          const memberIds = template.members.map(m => m.defId).filter(id => id !== leadMember);
          const backends: Record<string, string> = {};
          for (const m of template.members) { if (m.backend) backends[m.defId] = m.backend; }
          handler({
            type: "CREATE_TEAM",
            leadId: leadMember,
            memberIds,
            backends,
            workDir: template.workDir ?? telegramWorkDir,
          }, tgMeta());
          setTimeout(() => handler({ type: "PING" }, tgMeta()), 1000);
          bot!.sendMessage(chatId, `Team template "${template.name}" loaded (${template.members.length} members)`).catch(() => {});
          return;
        }

        // Otherwise treat as a role to add to existing team
        const def = findDefByRole(arg);
        if (!def) {
          bot!.sendMessage(chatId, `No agent found matching "${arg}".\nTry: frontend, backend, prototyper, designer, product, senior`).catch(() => {});
          return;
        }

        if (!currentTeamId) {
          // No team exists yet — create one with this agent + default lead
          handler({
            type: "CREATE_TEAM",
            leadId: "marcus",
            memberIds: [def.id, "sophie"],
            backends: {},
            workDir: telegramWorkDir,
          }, tgMeta());
          setTimeout(() => handler({ type: "PING" }, tgMeta()), 1000);
          bot!.sendMessage(chatId, `Created team with Marcus (Lead) + ${def.name} (${def.role}) + Sophie (Reviewer)`).catch(() => {});
          return;
        }

        // Team exists — add agent to it
        const agentId = `agent-${nanoid(6)}`;
        handler({
          type: "CREATE_AGENT",
          agentId,
          name: def.name,
          role: `${def.role} — ${def.skills}`,
          palette: def.palette,
          personality: def.personality,
          backend: config.defaultBackend,
          workDir: telegramWorkDir,
          teamId: currentTeamId,
        }, tgMeta());
        setTimeout(() => handler({ type: "PING" }, tgMeta()), 500);
        bot!.sendMessage(chatId, `Added ${def.name} (${def.role}) to team\nID: ${agentId}`).catch(() => {});
        stickyAgent.set(`${chatId}:${userId}`, agentId);
        return;
      }

      // --- /fire [name] ---
      if (text.startsWith("/fire")) {
        const nameArg = text.slice(5).trim();
        let targetId: string | undefined;
        if (nameArg) {
          const found = findAgentByName(nameArg);
          targetId = found?.id;
        } else {
          targetId = stickyAgent.get(`${chatId}:${userId}`);
        }
        if (!targetId) {
          bot!.sendMessage(chatId, "No agent to fire. Use /fire <name> or select an agent first.").catch(() => {});
          return;
        }
        const agentName = currentMenu.find(a => a.id === targetId)?.name ?? targetId;
        handler({ type: "FIRE_AGENT", agentId: targetId }, tgMeta());
        // Clear sticky if it was this agent
        if (stickyAgent.get(`${chatId}:${userId}`) === targetId) {
          stickyAgent.delete(`${chatId}:${userId}`);
        }
        bot!.sendMessage(chatId, `Fired ${agentName}`).catch(() => {});
        return;
      }

      // --- /switch <backend> ---
      if (text.startsWith("/switch")) {
        const backend = text.slice(7).trim().toLowerCase();
        const agentId = stickyAgent.get(`${chatId}:${userId}`);
        if (!agentId) {
          bot!.sendMessage(chatId, "Select an agent first, then /switch <backend>").catch(() => {});
          return;
        }
        if (!backend) {
          bot!.sendMessage(chatId, `Usage: /switch <backend>\nAvailable: ${detectedBackends.join(", ") || "claude, gemini, kiro"}`).catch(() => {});
          return;
        }
        agentModelOverride.set(agentId, ""); // reset model on backend switch
        bot!.sendMessage(chatId, `Backend switch noted: ${backend}\nThis will apply when you next /hire an agent. Existing agents keep their backend.`).catch(() => {});
        return;
      }

      // --- /cancel ---
      if (text === "/cancel" || text === `/cancel@${botInfo.username}`) {
        const agentId = resolveAgentFromReply(msg) ?? stickyAgent.get(`${chatId}:${userId}`);
        if (agentId) {
          handler({ type: "CANCEL_TASK", agentId, taskId: "" }, tgMeta());
          const name = currentMenu.find(a => a.id === agentId)?.name ?? agentId;
          bot!.sendMessage(chatId, `Cancelled ${name}'s current task`).catch(() => {});
        } else {
          bot!.sendMessage(chatId, "Select an agent first.").catch(() => {});
        }
        return;
      }

      // --- /retry ---
      if (text === "/retry" || text === `/retry@${botInfo.username}`) {
        const agentId = stickyAgent.get(`${chatId}:${userId}`);
        if (!agentId) { bot!.sendMessage(chatId, "Select an agent first.").catch(() => {}); return; }
        const last = lastTaskResults.get(agentId);
        if (!last) { bot!.sendMessage(chatId, "No previous task to retry.").catch(() => {}); return; }
        const taskId = nanoid();
        // Inject error context if last attempt failed
        let retryPrompt = last.prompt;
        if (last.lastError) {
          retryPrompt = `${last.prompt}\n\n[RETRY — Previous attempt failed with: ${last.lastError.slice(0, 500)}]\nDiagnose the root cause and try a different approach. Do NOT repeat the same approach that failed.`;
        }
        handler({ type: "RUN_TASK", agentId, taskId, prompt: retryPrompt, repoPath: telegramWorkDir }, tgMeta());
        bot!.sendMessage(chatId, last.lastError ? "Retrying with error context..." : "Retrying last task...").catch(() => {});
        return;
      }

      // --- /queue ---
      if (text === "/queue" || text === `/queue@${botInfo.username}`) {
        if (currentMenu.length === 0) {
          bot!.sendMessage(chatId, "No agents hired.").catch(() => {});
        } else {
          const lines = currentMenu.map(a => {
            const isWorking = statusMessages.has(anchorKey(chatId, a.id));
            const status = isWorking ? "🔄 working" : "💤 idle";
            return `• ${a.name}: ${status}`;
          });
          bot!.sendMessage(chatId, `Agent Queue:\n${lines.join("\n")}`).catch(() => {});
        }
        handler({ type: "PING" }, tgMeta());
        return;
      }

      // --- /history ---
      if (text === "/history" || text === `/history@${botInfo.username}`) {
        if (taskHistory.length === 0) {
          bot!.sendMessage(chatId, "No task history yet.").catch(() => {});
          return;
        }
        const lines = taskHistory.slice(-5).reverse().map((h, i) => {
          const dur = h.durationMs ? ` (${Math.round(h.durationMs / 1000)}s)` : "";
          const files = h.changedFiles.length ? ` [${h.changedFiles.length} files]` : "";
          return `${i + 1}. <b>${h.agentName}</b>${dur}${files}\n   ${h.summary.slice(0, 100)}`;
        });
        bot!.sendMessage(chatId, `Recent tasks:\n\n${lines.join("\n\n")}`, { parse_mode: "HTML" }).catch(() => {});
        return;
      }

      // --- /project <path> ---
      if (text.startsWith("/project")) {
        const pathArg = text.slice(8).trim();
        if (!pathArg) {
          bot!.sendMessage(chatId, `Current project: ${telegramWorkDir ?? config.defaultWorkspace ?? "(default)"}\n\nUsage: /project <path>`).catch(() => {});
          return;
        }
        telegramWorkDir = pathArg;
        bot!.sendMessage(chatId, `Working directory set to: ${pathArg}`).catch(() => {});
        return;
      }

      // --- /projects ---
      if (text === "/projects" || text === `/projects@${botInfo.username}`) {
        handler({ type: "LIST_PROJECTS" }, tgMeta());
        bot!.sendMessage(chatId, "Loading projects...").catch(() => {});
        return;
      }

      // --- /git ---
      if (text === "/git" || text === `/git@${botInfo.username}`) {
        handleGitCommand(chatId);
        return;
      }

      // --- /broadcast <message> ---
      if (text.startsWith("/broadcast")) {
        const prompt = text.slice(10).trim();
        if (!prompt) { bot!.sendMessage(chatId, "Usage: /broadcast <message>").catch(() => {}); return; }
        const agents = currentMenu.filter(a => a.id !== "marcus" && a.id !== "sophie"); // skip lead/reviewer
        if (agents.length === 0) { bot!.sendMessage(chatId, "No agents to broadcast to.").catch(() => {}); return; }
        for (const a of agents) {
          const taskId = nanoid();
          handler({ type: "RUN_TASK", agentId: a.id, taskId, prompt: `📱 ${prompt}`, repoPath: telegramWorkDir }, tgMeta());
        }
        bot!.sendMessage(chatId, `Broadcast sent to ${agents.length} agents.`).catch(() => {});
        return;
      }

      // --- /ask <name> <message> ---
      if (text.startsWith("/ask")) {
        const rest = text.slice(4).trim();
        const spaceIdx = rest.indexOf(" ");
        if (spaceIdx < 1) { bot!.sendMessage(chatId, "Usage: /ask <agent_name> <message>").catch(() => {}); return; }
        const name = rest.slice(0, spaceIdx);
        const prompt = rest.slice(spaceIdx + 1).trim();
        const agent = findAgentByName(name);
        if (!agent) { bot!.sendMessage(chatId, `Agent "${name}" not found.`).catch(() => {}); return; }
        const taskId = nanoid();
        handler({ type: "RUN_TASK", agentId: agent.id, taskId, prompt: `📱 ${prompt}`, repoPath: telegramWorkDir }, tgMeta());
        // Set up reply chain so response comes back
        replyToAgent.set(msg.message_id, agent.id);
        bot!.sendMessage(chatId, `Asked ${agent.name}: "${prompt.slice(0, 60)}..."`).catch(() => {});
        return;
      }

      // --- /delegate <name> <task> ---
      if (text.startsWith("/delegate")) {
        const rest = text.slice(9).trim();
        const spaceIdx = rest.indexOf(" ");
        if (spaceIdx < 1) { bot!.sendMessage(chatId, "Usage: /delegate <agent_name> <task>").catch(() => {}); return; }
        const name = rest.slice(0, spaceIdx);
        const prompt = rest.slice(spaceIdx + 1).trim();
        const agent = findAgentByName(name);
        if (!agent) { bot!.sendMessage(chatId, `Agent "${name}" not found.`).catch(() => {}); return; }
        const taskId = nanoid();
        handler({ type: "RUN_TASK", agentId: agent.id, taskId, prompt: `📱 ${prompt}`, repoPath: telegramWorkDir }, tgMeta());
        replyToAgent.set(msg.message_id, agent.id);
        bot!.sendMessage(chatId, `Delegated to ${agent.name}.`).catch(() => {});
        return;
      }

      // --- /mute ---
      if (text === "/mute" || text === `/mute@${botInfo.username}`) {
        mutedChats.add(chatId);
        bot!.sendMessage(chatId, "Background notifications muted. You'll still get responses to your messages.").catch(() => {});
        return;
      }

      // --- /unmute ---
      if (text === "/unmute" || text === `/unmute@${botInfo.username}`) {
        mutedChats.delete(chatId);
        bot!.sendMessage(chatId, "Notifications unmuted.").catch(() => {});
        return;
      }

      // --- /diff ---
      if (text === "/diff" || text === `/diff@${botInfo.username}`) {
        handleDiffCommand(chatId);
        return;
      }

      // --- /preview ---
      if (text === "/preview" || text === `/preview@${botInfo.username}`) {
        const agentId = stickyAgent.get(`${chatId}:${userId}`);
        const last = agentId ? lastTaskResults.get(agentId) : undefined;
        if (last?.previewUrl) {
          bot!.sendMessage(chatId, `Preview: ${last.previewUrl}`).catch(() => {});
        } else {
          bot!.sendMessage(chatId, "No preview available.").catch(() => {});
        }
        return;
      }

      // --- /files ---
      if (text === "/files" || text === `/files@${botInfo.username}`) {
        const agentId = stickyAgent.get(`${chatId}:${userId}`);
        const last = agentId ? lastTaskResults.get(agentId) : undefined;
        if (last?.changedFiles.length) {
          const fileList = last.changedFiles.map(f => `• ${f}`).join("\n");
          bot!.sendMessage(chatId, tgTruncate(`Changed files:\n${fileList}`)).catch(() => {});
        } else {
          bot!.sendMessage(chatId, "No files changed in the last task.").catch(() => {});
        }
        return;
      }

      // --- /backends ---
      if (text === "/backends" || text === `/backends@${botInfo.username}`) {
        const list = detectedBackends.length > 0
          ? detectedBackends.map(b => `• ${b}${b === config.defaultBackend ? " (default)" : ""}`).join("\n")
          : "No backends detected.";
        bot!.sendMessage(chatId, `AI Backends:\n${list}`).catch(() => {});
        return;
      }

      // --- /model <name> ---
      if (text.startsWith("/model")) {
        const model = text.slice(6).trim();
        const agentId = stickyAgent.get(`${chatId}:${userId}`);
        if (!agentId) { bot!.sendMessage(chatId, "Select an agent first.").catch(() => {}); return; }
        if (!model) {
          const current = agentModelOverride.get(agentId);
          bot!.sendMessage(chatId, current ? `Current model: ${current}` : "No model override set. Usage: /model <name>").catch(() => {});
          return;
        }
        agentModelOverride.set(agentId, model);
        const name = currentMenu.find(a => a.id === agentId)?.name ?? agentId;
        bot!.sendMessage(chatId, `Model for ${name} set to: ${model}`).catch(() => {});
        return;
      }

      // --- /status ---
      if (text === "/status" || text === `/status@${botInfo.username}`) {
        handler({ type: "PING" }, tgMeta());
        return;
      }

      // --- /yes, /no (legacy approval) ---
      if (text === "/yes" || text === "/no") {
        handler(
          { type: "APPROVAL_DECISION", approvalId: "__all__", decision: text.slice(1) as "yes" | "no" },
          tgMeta(),
        );
        return;
      }

      // --- Agent selection commands ---
      const cmdMatch = text.match(/^\/([a-z0-9_]+)(?:@\S+)?$/);
      if (cmdMatch) {
        const cmd = cmdMatch[1];
        const resolvedAgentId = cmdToAgentId.get(cmd);
        if (resolvedAgentId) {
          const agentDef = currentMenu.find((a) => a.id === resolvedAgentId);
          const displayName = agentDef?.name ?? resolvedAgentId;
          stickyAgent.set(`${chatId}:${userId}`, resolvedAgentId);
          bot!.sendMessage(chatId,
            `Now talking to ${displayName}. Send messages directly.`,
          ).then((sent) => {
            replyToAgent.set(sent.message_id, resolvedAgentId);
            anchorMessages.set(anchorKey(chatId, resolvedAgentId), sent.message_id);
            evictIfNeeded(replyToAgent);
          }).catch(() => {});
          return;
        }
      }

      // Ignore unknown commands
      if (text.startsWith("/")) return;

      // =====================================================================
      // FREE TEXT — route to sticky/reply agent
      // =====================================================================

      const agentId = resolveAgentFromReply(msg) ?? stickyAgent.get(`${chatId}:${userId}`) ?? null;
      if (!agentId) {
        bot!.sendMessage(chatId,
          "Select an agent first. Type /help to see available commands.",
        ).catch(() => {});
        return;
      }

      const def = currentMenu.find((a) => a.id === agentId);
      const taskId = nanoid();

      // Store prompt for /retry
      lastTaskResults.set(agentId, {
        ...(lastTaskResults.get(agentId) ?? { summary: "", changedFiles: [], previewUrl: "" }),
        prompt: text,
      });

      handler(
        {
          type: "RUN_TASK",
          agentId,
          taskId,
          prompt: agentModelOverride.get(agentId) ? `[Model: ${agentModelOverride.get(agentId)}]\n📱 ${text}` : `📱 ${text}`,
          repoPath: telegramWorkDir,
          ...(def ? { name: def.name, role: def.role, personality: def.personality } : {}),
        },
        tgMeta(),
      );
    });

    return true;
  },

  // =========================================================================
  // BROADCAST — handle gateway events
  // =========================================================================

  broadcast(event: GatewayEvent) {
    if (!bot) return;

    // Store detected backends for /backends command
    if (event.type === "BACKENDS_AVAILABLE") {
      detectedBackends = (event as any).backends ?? [];
      return;
    }

    // Track current team ID
    if (event.type === "TEAM_PHASE") {
      currentTeamId = (event as any).teamId;
      return;
    }

    // Store project list for /projects
    if (event.type === "PROJECT_LIST") {
      const projects = (event as any).projects as Array<{ name: string; startedAt: number; agentNames: string[] }>;
      if (projects && activeChatIds.size > 0) {
        const lines = projects.slice(0, 10).map((p, i) =>
          `${i + 1}. ${p.name} (${p.agentNames.join(", ")})`
        );
        const text = lines.length > 0 ? `Projects:\n${lines.join("\n")}` : "No projects found.";
        for (const chatId of activeChatIds) {
          bot.sendMessage(chatId, text).catch(() => {});
        }
      }
      return;
    }

    const agentId = "agentId" in event ? (event as any).agentId as string : null;
    if (!agentId) return;

    // Determine if this agent has an active Telegram conversation
    const hasChain = [...replyToAgent.values()].includes(agentId);

    for (const chatId of activeChatIds) {
      const key = anchorKey(chatId, agentId);
      const anchor = anchorMessages.get(key);

      // --- TASK_STARTED ---
      if (event.type === "TASK_STARTED") {
        if (!hasChain && mutedChats.has(chatId)) continue;
        const agentName = buildAgentMenu().find(a => a.id === agentId)?.name ?? agentId;
        const prefix = hasChain ? "" : `[${agentName}] `;
        bot.sendMessage(chatId, `${prefix}Working on it...`, {
          ...(anchor ? { reply_to_message_id: anchor } : {}),
        }).then((sent) => {
          statusMessages.set(key, sent.message_id);
          replyToAgent.set(sent.message_id, agentId);
          evictIfNeeded(replyToAgent);
        }).catch((err: Error) => {
          console.error("[Telegram] Send failed:", err.message);
        });
      }

      // --- LOG_APPEND (live streaming) ---
      if (event.type === "LOG_APPEND") {
        const chunk = (event as any).chunk as string;
        if (!chunk || !statusMessages.has(key)) continue;
        const buf = (streamBuffers.get(key) ?? "") + chunk;
        streamBuffers.set(key, buf);

        // Throttle edits
        if (!streamTimers.has(key)) {
          streamTimers.set(key, setTimeout(() => {
            streamTimers.delete(key);
            const msgId = statusMessages.get(key);
            const currentBuf = streamBuffers.get(key) ?? "";
            if (!msgId || !currentBuf) return;
            // Show last 3500 chars (leave room for prefix)
            const display = currentBuf.length > 3500 ? "…" + currentBuf.slice(-3500) : currentBuf;
            bot!.editMessageText(display, { chat_id: chatId, message_id: msgId }).catch(() => {});
          }, STREAM_THROTTLE_MS));
        }
      }

      // --- TOOL_ACTIVITY (thinking/tool indicators) ---
      if (event.type === "TOOL_ACTIVITY") {
        const toolText = (event as any).text as string;
        if (!toolText || !statusMessages.has(key)) continue;
        // Append tool indicator to stream buffer so next edit includes it
        const indicator = toolText.includes("Think") ? `💭 ${toolText}` : `🔧 ${toolText}`;
        const buf = streamBuffers.get(key) ?? "";
        streamBuffers.set(key, buf ? `${buf}\n${indicator}` : indicator);

        // Trigger an immediate edit for tool activity (feels responsive)
        if (!streamTimers.has(key)) {
          streamTimers.set(key, setTimeout(() => {
            streamTimers.delete(key);
            const msgId = statusMessages.get(key);
            const currentBuf = streamBuffers.get(key) ?? "";
            if (!msgId || !currentBuf) return;
            const display = currentBuf.length > 3500 ? "…" + currentBuf.slice(-3500) : currentBuf;
            bot!.editMessageText(display, { chat_id: chatId, message_id: msgId }).catch(() => {});
          }, 1000)); // Faster for tool activity (1s instead of 3s)
        }
      }

      // --- TASK_DONE ---
      if (event.type === "TASK_DONE") {
        // Clear stream state
        streamBuffers.delete(key);
        const timer = streamTimers.get(key);
        if (timer) { clearTimeout(timer); streamTimers.delete(key); }

        if (!hasChain && mutedChats.has(chatId)) continue;

        const r = (event as any).result;
        const summary = (r?.summary ?? "Done").slice(0, 500);
        const files: string[] = r?.changedFiles ?? [];
        const previewUrl = buildTunnelPreviewLink(r);
        const agentName = buildAgentMenu().find(a => a.id === agentId)?.name ?? agentId;
        const prefix = hasChain ? "" : `[${agentName}] `;
        const text = `${prefix}${summary}${files.length ? `\n\n📁 ${files.length} files changed` : ""}`;

        // Store in history
        taskHistory.push({ agentName, agentId, summary, timestamp: Date.now(), changedFiles: files, previewUrl, durationMs: (r as any)?.durationMs });
        if (taskHistory.length > MAX_HISTORY) taskHistory.shift();
        lastTaskResults.set(agentId, { summary, changedFiles: files, previewUrl, prompt: lastTaskResults.get(agentId)?.prompt ?? "", lastError: undefined });

        // Build inline buttons
        const buttons: TelegramBot.InlineKeyboardButton[][] = [];
        const row: TelegramBot.InlineKeyboardButton[] = [];
        row.push({ text: "🔄 Retry", callback_data: `retry:${agentId}` });
        if (files.length > 0) row.push({ text: "📁 Files", callback_data: `files:${agentId}` });
        if (previewUrl) row.push({ text: "🔗 Preview", url: previewUrl });
        buttons.push(row);
        const replyMarkup: TelegramBot.InlineKeyboardMarkup = { inline_keyboard: buttons };

        const msgId = statusMessages.get(key);
        if (msgId) {
          bot.editMessageText(tgTruncate(text), { chat_id: chatId, message_id: msgId, reply_markup: replyMarkup }).catch(() => {
            bot!.sendMessage(chatId, tgTruncate(text), { reply_markup: replyMarkup }).catch(() => {});
          });
          statusMessages.delete(key);
        } else {
          bot.sendMessage(chatId, tgTruncate(text), { reply_markup: replyMarkup }).catch(() => {});
        }
      }

      // --- TASK_FAILED ---
      if (event.type === "TASK_FAILED") {
        streamBuffers.delete(key);
        const timer = streamTimers.get(key);
        if (timer) { clearTimeout(timer); streamTimers.delete(key); }

        // Store error for /retry context
        const errMsg = ((event as any).error ?? "Unknown error").slice(0, 300);
        const existing = lastTaskResults.get(agentId);
        if (existing) {
          lastTaskResults.set(agentId, { ...existing, lastError: errMsg });
        }

        if (!hasChain && mutedChats.has(chatId)) continue;
        const agentName = buildAgentMenu().find(a => a.id === agentId)?.name ?? agentId;
        const prefix = hasChain ? "" : `[${agentName}] `;
        const text = `${prefix}❌ Failed: ${errMsg}`;
        const msgId = statusMessages.get(key);

        if (msgId) {
          bot.editMessageText(text, { chat_id: chatId, message_id: msgId }).catch(() => {
            bot!.sendMessage(chatId, text).catch(() => {});
          });
          statusMessages.delete(key);
        } else {
          bot.sendMessage(chatId, text).catch(() => {});
        }
      }

      // --- APPROVAL_NEEDED (with inline buttons) ---
      if (event.type === "APPROVAL_NEEDED") {
        const e = event as any;
        const keyboard: TelegramBot.InlineKeyboardMarkup = {
          inline_keyboard: [[
            { text: "✅ Approve", callback_data: `approve:${e.approvalId}` },
            { text: "❌ Reject", callback_data: `reject:${e.approvalId}` },
          ]],
        };
        bot.sendMessage(chatId,
          `🔐 <b>Approval needed</b>\n${e.title}\n${(e.summary ?? "").slice(0, 500)}`,
          { parse_mode: "HTML", reply_markup: keyboard, ...(anchor ? { reply_to_message_id: anchor } : {}) },
        ).then((sent) => {
          replyToAgent.set(sent.message_id, agentId);
        }).catch(() => {});
      }

      // --- AGENT_CREATED (notification) ---
      if (event.type === "AGENT_CREATED" && !hasChain && !mutedChats.has(chatId)) {
        const e = event as any;
        if (e.isExternal) continue; // don't notify about external process detection
        // Only notify if this wasn't from our own /hire command (avoid double msg)
        // Skip — handled by the /hire response already
      }
    }
  },

  destroy() {
    bot?.stopPolling();
    bot = null;
    commandHandler = null;
    replyToAgent.clear();
    anchorMessages.clear();
    statusMessages.clear();
    activeChatIds.clear();
    cmdToAgentId.clear();
    stickyAgent.clear();
    streamBuffers.clear();
    for (const timer of streamTimers.values()) clearTimeout(timer);
    streamTimers.clear();
    mutedChats.clear();
  },
};

// ---------------------------------------------------------------------------
// Command helpers (need access to bot + state)
// ---------------------------------------------------------------------------

function handleGitCommand(chatId: number) {
  const cwd = telegramWorkDir ?? config.defaultWorkspace;
  if (!cwd) { bot?.sendMessage(chatId, "No project directory set. Use /project <path>").catch(() => {}); return; }
  try {
    const branch = execSync("git branch --show-current", { cwd, encoding: "utf-8", timeout: 5000 }).trim();
    const status = execSync("git status --short", { cwd, encoding: "utf-8", timeout: 5000 }).trim();
    const text = `Branch: ${branch}\nDir: ${cwd}\n\n${status || "(clean)"}`;
    bot?.sendMessage(chatId, tgTruncate(text)).catch(() => {});
  } catch (err) {
    bot?.sendMessage(chatId, `Git error: ${(err as Error).message?.slice(0, 200)}`).catch(() => {});
  }
}

function handleDiffCommand(chatId: number) {
  const cwd = telegramWorkDir ?? config.defaultWorkspace;
  if (!cwd) { bot?.sendMessage(chatId, "No project directory set.").catch(() => {}); return; }
  try {
    const diff = execSync("git diff --stat HEAD~1", { cwd, encoding: "utf-8", timeout: 10000 }).trim();
    bot?.sendMessage(chatId, tgTruncate(diff || "(no changes)")).catch(() => {});
  } catch (err) {
    bot?.sendMessage(chatId, `Diff error: ${(err as Error).message?.slice(0, 200)}`).catch(() => {});
  }
}
