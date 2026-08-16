import { z } from "zod";
import { AgentStatusEnum, RiskLevelEnum, TeamPhaseEnum } from "./types";

export const AgentStatusEvent = z.object({
  type: z.literal("AGENT_STATUS"),
  agentId: z.string(),
  status: AgentStatusEnum,
  details: z.string().optional(),
});

export const TaskStartedEvent = z.object({
  type: z.literal("TASK_STARTED"),
  agentId: z.string(),
  taskId: z.string(),
  prompt: z.string(),
});

export const LogAppendEvent = z.object({
  type: z.literal("LOG_APPEND"),
  agentId: z.string(),
  taskId: z.string(),
  stream: z.enum(["stdout", "stderr"]),
  chunk: z.string(),
});

export const ApprovalNeededEvent = z.object({
  type: z.literal("APPROVAL_NEEDED"),
  approvalId: z.string(),
  agentId: z.string(),
  taskId: z.string(),
  title: z.string(),
  summary: z.string(),
  riskLevel: RiskLevelEnum,
});

export const TokenUsage = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
});

export const TaskResultPayload = z.object({
  summary: z.string(),
  fullOutput: z.string().optional(),
  changedFiles: z.array(z.string()),
  diffStat: z.string(),
  testResult: z.enum(["passed", "failed", "unknown"]),
  nextSuggestion: z.string().optional(),
  previewUrl: z.string().optional(),
  previewPath: z.string().optional(),
  entryFile: z.string().optional(),
  projectDir: z.string().optional(),
  previewCmd: z.string().optional(),
  previewPort: z.number().optional(),
  tokenUsage: TokenUsage.optional(),
});

export const TaskDoneEvent = z.object({
  type: z.literal("TASK_DONE"),
  agentId: z.string(),
  taskId: z.string(),
  result: TaskResultPayload,
  isFinalResult: z.boolean().optional(),
});

export const TaskFailedEvent = z.object({
  type: z.literal("TASK_FAILED"),
  agentId: z.string(),
  taskId: z.string(),
  error: z.string(),
});

export const TaskDelegatedEvent = z.object({
  type: z.literal("TASK_DELEGATED"),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  taskId: z.string(),
  prompt: z.string(),
});

export const AgentCreatedEvent = z.object({
  type: z.literal("AGENT_CREATED"),
  agentId: z.string(),
  name: z.string(),
  role: z.string(),
  palette: z.number().optional(),
  personality: z.string().optional(),
  backend: z.string().optional(),
  isTeamLead: z.boolean().optional(),
  teamId: z.string().optional(),
  isExternal: z.boolean().optional(),
  pid: z.number().optional(),
  cwd: z.string().optional(),
  workDir: z.string().optional(),
  startedAt: z.number().optional(),
  autoMerge: z.boolean().optional(),
  pendingMerge: z.boolean().optional(),
  lastMergeCommit: z.string().nullable().optional(),
  lastMergeMessage: z.string().nullable().optional(),
  undoCount: z.number().optional(),
});

export const AgentFiredEvent = z.object({
  type: z.literal("AGENT_FIRED"),
  agentId: z.string(),
});

export const TaskResultReturnedEvent = z.object({
  type: z.literal("TASK_RESULT_RETURNED"),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  taskId: z.string(),
  summary: z.string(),
  success: z.boolean(),
});

export const TeamChatEvent = z.object({
  type: z.literal("TEAM_CHAT"),
  fromAgentId: z.string(),
  toAgentId: z.string().optional(),
  message: z.string(),
  messageType: z.enum(["delegation", "result", "status", "warning"]),
  taskId: z.string().optional(),
  timestamp: z.number(),
});

export const TaskQueuedEvent = z.object({
  type: z.literal("TASK_QUEUED"),
  agentId: z.string(),
  taskId: z.string(),
  prompt: z.string(),
  position: z.number(),
});

export const TokenUpdateEvent = z.object({
  type: z.literal("TOKEN_UPDATE"),
  agentId: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
});

export const ToolActivityEvent = z.object({
  type: z.literal("TOOL_ACTIVITY"),
  agentId: z.string(),
  text: z.string(),
});

export const TeamPhaseEvent = z.object({
  type: z.literal("TEAM_PHASE"),
  teamId: z.string(),
  phase: TeamPhaseEnum,
  leadAgentId: z.string(),
});

export const SuggestionEvent = z.object({
  type: z.literal("SUGGESTION"),
  text: z.string(),
  author: z.string(),
  timestamp: z.number(),
});

export const AgentDefsEvent = z.object({
  type: z.literal("AGENT_DEFS"),
  agents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    skills: z.string(),
    personality: z.string(),
    palette: z.number(),
    isBuiltin: z.boolean(),
    teamRole: z.enum(["dev", "reviewer", "leader"]),
    skillFiles: z.array(z.string()).optional(),
  })),
});

export const SkillListEvent = z.object({
  type: z.literal("SKILL_LIST"),
  skills: z.array(z.object({
    name: z.string(),
    title: z.string(),
    isFolder: z.boolean(),
  })),
});

export const AgentsSyncEvent = z.object({
  type: z.literal("AGENTS_SYNC"),
  agentIds: z.array(z.string()),
});

const ProjectPreviewSchema = z.object({
  entryFile: z.string().optional(),
  projectDir: z.string().optional(),
  previewCmd: z.string().optional(),
  previewPort: z.number().optional(),
}).optional();

export const ProjectListEvent = z.object({
  type: z.literal("PROJECT_LIST"),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    startedAt: z.number(),
    endedAt: z.number(),
    agentNames: z.array(z.string()),
    eventCount: z.number(),
    preview: ProjectPreviewSchema,
    tokenUsage: z.object({ inputTokens: z.number(), outputTokens: z.number() }).optional(),
    ratings: z.record(z.string(), z.number()).optional(),
  })),
});

export const ProjectDataEvent = z.object({
  type: z.literal("PROJECT_DATA"),
  projectId: z.string(),
  name: z.string(),
  startedAt: z.number(),
  endedAt: z.number(),
  events: z.array(z.any()),
});

export const PreviewReadyEvent = z.object({
  type: z.literal("PREVIEW_READY"),
  url: z.string(),
});

export const FolderPickedEvent = z.object({
  type: z.literal("FOLDER_PICKED"),
  requestId: z.string(),
  path: z.string(),
});

export const ImageUploadedEvent = z.object({
  type: z.literal("IMAGE_UPLOADED"),
  requestId: z.string(),
  path: z.string(),
});


export const WorktreeReadyEvent = z.object({
  type: z.literal("WORKTREE_READY"),
  agentId: z.string(),
  taskId: z.string(),
  branch: z.string(),
});

export const WorktreeMergedEvent = z.object({
  type: z.literal("WORKTREE_MERGED"),
  agentId: z.string(),
  branch: z.string(),
  success: z.boolean(),
  commitHash: z.string().optional(),
  commitMessage: z.string().optional(),
  undoCount: z.number().optional(),
});

export const WorktreeRevertedEvent = z.object({
  type: z.literal("WORKTREE_REVERTED"),
  agentId: z.string(),
  success: z.boolean(),
  commitId: z.string().optional(),
  commitsAhead: z.number(),
  message: z.string().optional(),
});

export const AutoMergeUpdatedEvent = z.object({
  type: z.literal("AUTO_MERGE_UPDATED"),
  agentId: z.string(),
  autoMerge: z.boolean(),
  lastMergeCommit: z.string().nullable().optional(),
  lastMergeMessage: z.string().nullable().optional(),
  undoCount: z.number().optional(),
});

export const BackendsAvailableEvent = z.object({
  type: z.literal("BACKENDS_AVAILABLE"),
  backends: z.array(z.string()),
});

export const ConfigLoadedEvent = z.object({
  type: z.literal("CONFIG_LOADED"),
  telegramBotToken: z.string().optional(),
  telegramAllowedUsers: z.array(z.string()).optional(),
  telegramConnected: z.boolean().optional(),
  worktreeEnabled: z.boolean().optional(),
  autoMergeEnabled: z.boolean().optional(),
  tunnelBaseUrl: z.string().optional(),
  tunnelToken: z.string().optional(),
  tunnelRunning: z.boolean().optional(),
  defaultBackend: z.string().optional(),
  defaultModels: z.record(z.string(), z.string()).optional(),
  sandboxMode: z.enum(["full", "safe"]).optional(),
  detectedBackends: z.array(z.string()).optional(),
  machineId: z.string().optional(),
  workspace: z.string().optional(),
  dataDir: z.string().optional(),
  githubToken: z.string().optional(),
  githubRemote: z.string().optional(),
  recentWorkspaces: z.array(z.string()).optional(),
  webhooks: z.array(z.object({
    url: z.string(),
    secret: z.string().optional(),
    events: z.array(z.string()),
    enabled: z.boolean(),
  })).optional(),
});

export const ConfigSavedEvent = z.object({
  type: z.literal("CONFIG_SAVED"),
  success: z.boolean(),
  message: z.string(),
  telegramConnected: z.boolean().optional(),
  tunnelRunning: z.boolean().optional(),
});

export const ChatHistoryLoadedEvent = z.object({
  type: z.literal("CHAT_HISTORY_LOADED"),
  /** Serialized PersistedAgent[] — same format as localStorage */
  data: z.string(),
});

export const LogsLoadedEvent = z.object({
  type: z.literal("LOGS_LOADED"),
  lines: z.array(z.string()),
});

export const MetricsLoadedEvent = z.object({
  type: z.literal("METRICS_LOADED"),
  agents: z.record(z.string(), z.object({
    agentId: z.string(),
    agentName: z.string(),
    backend: z.string(),
    taskCount: z.number(),
    successCount: z.number(),
    failCount: z.number(),
    totalInputTokens: z.number(),
    totalOutputTokens: z.number(),
    totalDurationMs: z.number(),
    lastTaskAt: z.number(),
  })),
  updatedAt: z.number(),
});

export const TeamTemplatesLoadedEvent = z.object({
  type: z.literal("TEAM_TEMPLATES_LOADED"),
  templates: z.array(z.object({
    name: z.string(),
    members: z.array(z.object({ defId: z.string(), backend: z.string().optional() })),
    workDir: z.string().optional(),
  })),
});

export const FileListEvent = z.object({
  type: z.literal("FILE_LIST"),
  path: z.string(),
  entries: z.array(z.object({
    name: z.string(),
    path: z.string(),
    isDir: z.boolean(),
    size: z.number().optional(),
  })),
});

export const FileContentEvent = z.object({
  type: z.literal("FILE_CONTENT"),
  path: z.string(),
  content: z.string(),
  truncated: z.boolean().optional(),
});

export const GitStatusEvent = z.object({
  type: z.literal("GIT_STATUS"),
  branch: z.string(),
  changes: z.array(z.object({
    status: z.string(),
    file: z.string(),
  })),
  ahead: z.number().optional(),
  behind: z.number().optional(),
});

export const GitLogEvent = z.object({
  type: z.literal("GIT_LOG"),
  commits: z.array(z.object({
    hash: z.string(),
    message: z.string(),
    author: z.string(),
    date: z.string(),
  })),
});

export const GitPushResultEvent = z.object({
  type: z.literal("GIT_PUSH_RESULT"),
  success: z.boolean(),
  message: z.string(),
  branch: z.string().optional(),
});

export const PrCreatedEvent = z.object({
  type: z.literal("PR_CREATED"),
  success: z.boolean(),
  url: z.string().optional(),
  message: z.string(),
});

export const PipelinesLoadedEvent = z.object({
  type: z.literal("PIPELINES_LOADED"),
  pipelines: z.array(z.object({
    name: z.string(),
    steps: z.array(z.object({
      id: z.string(),
      agentRole: z.string(),
      prompt: z.string(),
      dependsOn: z.array(z.string()).optional(),
    })),
  })),
});

export const PipelineProgressEvent = z.object({
  type: z.literal("PIPELINE_PROGRESS"),
  pipelineName: z.string(),
  stepId: z.string(),
  status: z.enum(["pending", "running", "done", "failed"]),
  result: z.string().optional(),
});

export const FileDiffEvent = z.object({
  type: z.literal("FILE_DIFF"),
  file: z.string(),
  diff: z.string(),
});

export const SchedulesLoadedEvent = z.object({
  type: z.literal("SCHEDULES_LOADED"),
  schedules: z.array(z.object({
    id: z.string(),
    name: z.string(),
    agentId: z.string(),
    prompt: z.string(),
    intervalMinutes: z.number(),
    enabled: z.boolean(),
    lastRunAt: z.number().nullable(),
    nextRunAt: z.number(),
    runCount: z.number(),
  })),
});

export const CommandsLoadedEvent = z.object({
  type: z.literal("COMMANDS_LOADED"),
  commands: z.array(z.object({
    command: z.string(),
    description: z.string(),
    category: z.string(),
    argHint: z.string().optional(),
  })),
});

export const AgentDetailsLoadedEvent = z.object({
  type: z.literal("AGENT_DETAILS_LOADED"),
  agentId: z.string(),
  name: z.string(),
  role: z.string(),
  backend: z.string().optional(),
  personality: z.string().optional(),
  palette: z.number().optional(),
  skillFiles: z.array(z.string()).optional(),
  skills: z.array(z.object({
    name: z.string(),
    title: z.string(),
    content: z.string(),
  })).optional(),
  metrics: z.object({
    taskCount: z.number(),
    successCount: z.number(),
    failCount: z.number(),
    totalInputTokens: z.number(),
    totalOutputTokens: z.number(),
    totalDurationMs: z.number(),
    lastTaskAt: z.number(),
  }).optional(),
});

export const AgentMemoryLoadedEvent = z.object({
  type: z.literal("AGENT_MEMORY_LOADED"),
  agentId: z.string(),
  sessionHistory: z.array(z.object({
    taskId: z.string().optional(),
    summary: z.string(),
    timestamp: z.number(),
    durationMs: z.number().optional(),
    success: z.boolean().optional(),
  })),
  agentFacts: z.array(z.object({
    id: z.string(),
    text: z.string(),
    confidence: z.number().optional(),
    createdAt: z.number().optional(),
  })),
  sharedKnowledge: z.array(z.object({
    id: z.string(),
    text: z.string(),
    confirmedBy: z.array(z.string()).optional(),
  })),
});

export const GatewayEventSchema = z.discriminatedUnion("type", [
  AgentsSyncEvent,
  AgentStatusEvent,
  TaskStartedEvent,
  LogAppendEvent,
  ApprovalNeededEvent,
  TaskDoneEvent,
  TaskFailedEvent,
  TaskDelegatedEvent,
  AgentCreatedEvent,
  AgentFiredEvent,
  TaskResultReturnedEvent,
  TeamChatEvent,
  TaskQueuedEvent,
  TokenUpdateEvent,
  ToolActivityEvent,
  TeamPhaseEvent,
  AgentDefsEvent,
  SuggestionEvent,
  ProjectListEvent,
  ProjectDataEvent,
  PreviewReadyEvent,
  FolderPickedEvent,
  ImageUploadedEvent,
  BackendsAvailableEvent,
  ConfigLoadedEvent,
  ConfigSavedEvent,
  WorktreeReadyEvent,
  WorktreeMergedEvent,
  WorktreeRevertedEvent,
  AutoMergeUpdatedEvent,
  SkillListEvent,
  ChatHistoryLoadedEvent,
  LogsLoadedEvent,
  MetricsLoadedEvent,
  TeamTemplatesLoadedEvent,
  FileListEvent,
  FileContentEvent,
  GitStatusEvent,
  GitLogEvent,
  GitPushResultEvent,
  PrCreatedEvent,
  PipelinesLoadedEvent,
  PipelineProgressEvent,
  FileDiffEvent,
  SchedulesLoadedEvent,
  CommandsLoadedEvent,
  AgentDetailsLoadedEvent,
  AgentMemoryLoadedEvent,
]);

export type TokenUsage = z.infer<typeof TokenUsage>;
export type AgentStatusEvent = z.infer<typeof AgentStatusEvent>;
export type TaskStartedEvent = z.infer<typeof TaskStartedEvent>;
export type LogAppendEvent = z.infer<typeof LogAppendEvent>;
export type ApprovalNeededEvent = z.infer<typeof ApprovalNeededEvent>;
export type TaskResultPayload = z.infer<typeof TaskResultPayload>;
export type TaskDoneEvent = z.infer<typeof TaskDoneEvent>;
export type TaskFailedEvent = z.infer<typeof TaskFailedEvent>;
export type TaskDelegatedEvent = z.infer<typeof TaskDelegatedEvent>;
export type AgentCreatedEvent = z.infer<typeof AgentCreatedEvent>;
export type AgentFiredEvent = z.infer<typeof AgentFiredEvent>;
export type TaskResultReturnedEvent = z.infer<typeof TaskResultReturnedEvent>;
export type TeamChatEvent = z.infer<typeof TeamChatEvent>;
export type TaskQueuedEvent = z.infer<typeof TaskQueuedEvent>;
export type TokenUpdateEvent = z.infer<typeof TokenUpdateEvent>;
export type ToolActivityEvent = z.infer<typeof ToolActivityEvent>;
export type TeamPhaseEvent = z.infer<typeof TeamPhaseEvent>;
export type AgentDefsEvent = z.infer<typeof AgentDefsEvent>;
export type SuggestionEvent = z.infer<typeof SuggestionEvent>;
export type AgentsSyncEvent = z.infer<typeof AgentsSyncEvent>;
export type ProjectListEvent = z.infer<typeof ProjectListEvent>;
export type ProjectDataEvent = z.infer<typeof ProjectDataEvent>;
export type PreviewReadyEvent = z.infer<typeof PreviewReadyEvent>;
export type FolderPickedEvent = z.infer<typeof FolderPickedEvent>;
export type ImageUploadedEvent = z.infer<typeof ImageUploadedEvent>;
export type BackendsAvailableEvent = z.infer<typeof BackendsAvailableEvent>;
export type ConfigLoadedEvent = z.infer<typeof ConfigLoadedEvent>;
export type ConfigSavedEvent = z.infer<typeof ConfigSavedEvent>;
export type WorktreeReadyEvent = z.infer<typeof WorktreeReadyEvent>;
export type WorktreeMergedEvent = z.infer<typeof WorktreeMergedEvent>;
export type WorktreeRevertedEvent = z.infer<typeof WorktreeRevertedEvent>;
export type AutoMergeUpdatedEvent = z.infer<typeof AutoMergeUpdatedEvent>;
export type SkillListEvent = z.infer<typeof SkillListEvent>;
export type LogsLoadedEvent = z.infer<typeof LogsLoadedEvent>;
export type MetricsLoadedEvent = z.infer<typeof MetricsLoadedEvent>;
export type TeamTemplatesLoadedEvent = z.infer<typeof TeamTemplatesLoadedEvent>;
export type FileListEvent = z.infer<typeof FileListEvent>;
export type FileContentEvent = z.infer<typeof FileContentEvent>;
export type GitStatusEvent = z.infer<typeof GitStatusEvent>;
export type GitLogEvent = z.infer<typeof GitLogEvent>;
export type GitPushResultEvent = z.infer<typeof GitPushResultEvent>;
export type PrCreatedEvent = z.infer<typeof PrCreatedEvent>;
export type PipelinesLoadedEvent = z.infer<typeof PipelinesLoadedEvent>;
export type PipelineProgressEvent = z.infer<typeof PipelineProgressEvent>;
export type FileDiffEvent = z.infer<typeof FileDiffEvent>;
export type SchedulesLoadedEvent = z.infer<typeof SchedulesLoadedEvent>;
export type CommandsLoadedEvent = z.infer<typeof CommandsLoadedEvent>;
export type AgentDetailsLoadedEvent = z.infer<typeof AgentDetailsLoadedEvent>;
export type AgentMemoryLoadedEvent = z.infer<typeof AgentMemoryLoadedEvent>;
export type GatewayEvent = z.infer<typeof GatewayEventSchema>;
