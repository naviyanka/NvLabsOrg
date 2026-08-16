import { z } from "zod";
import { DecisionEnum } from "./types";

export const RunTaskCommand = z.object({
  type: z.literal("RUN_TASK"),
  agentId: z.string(),
  taskId: z.string(),
  prompt: z.string(),
  repoPath: z.string().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  personality: z.string().optional(),
  backend: z.string().optional(),
  teamId: z.string().optional(),
});

export const ApprovalDecisionCommand = z.object({
  type: z.literal("APPROVAL_DECISION"),
  approvalId: z.string(),
  decision: DecisionEnum,
});

export const CancelTaskCommand = z.object({
  type: z.literal("CANCEL_TASK"),
  agentId: z.string(),
  taskId: z.string(),
});

export const PingCommand = z.object({
  type: z.literal("PING"),
});

export const CreateAgentCommand = z.object({
  type: z.literal("CREATE_AGENT"),
  agentId: z.string(),
  name: z.string(),
  role: z.string(),
  palette: z.number().optional(),
  personality: z.string().optional(),
  backend: z.string().optional(),
  model: z.string().optional(),
  teamId: z.string().optional(),
  workDir: z.string().optional(),
  skillFiles: z.array(z.string()).optional(),
});

export const FireAgentCommand = z.object({
  type: z.literal("FIRE_AGENT"),
  agentId: z.string(),
});

export const OpenFileCommand = z.object({
  type: z.literal("OPEN_FILE"),
  path: z.string(),
});

export const CreateTeamCommand = z.object({
  type: z.literal("CREATE_TEAM"),
  leadId: z.string(),
  memberIds: z.array(z.string()),
  backends: z.record(z.string(), z.string()).optional(),
  workDir: z.string().optional(),
});

export const ServePreviewCommand = z.object({
  type: z.literal("SERVE_PREVIEW"),
  filePath: z.string().optional(),
  previewCmd: z.string().optional(),
  previewPort: z.number().optional(),
  cwd: z.string().optional(),
});

export const StopTeamCommand = z.object({
  type: z.literal("STOP_TEAM"),
});

export const FireTeamCommand = z.object({
  type: z.literal("FIRE_TEAM"),
});

export const KillExternalCommand = z.object({
  type: z.literal("KILL_EXTERNAL"),
  agentId: z.string(),
});

export const ApprovePlanCommand = z.object({
  type: z.literal("APPROVE_PLAN"),
  agentId: z.string(),
});

export const EndProjectCommand = z.object({
  type: z.literal("END_PROJECT"),
  agentId: z.string(),
  name: z.string().optional(),
  role: z.string().optional(),
  personality: z.string().optional(),
  backend: z.string().optional(),
});

export const SaveAgentDefCommand = z.object({
  type: z.literal("SAVE_AGENT_DEF"),
  agent: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    skills: z.string(),
    personality: z.string(),
    palette: z.number(),
    isBuiltin: z.boolean(),
    teamRole: z.enum(["dev", "reviewer", "leader"]),
    skillFiles: z.array(z.string()).optional(),
  }),
});

export const ListSkillsCommand = z.object({
  type: z.literal("LIST_SKILLS"),
});

export const SaveSkillCommand = z.object({
  type: z.literal("SAVE_SKILL"),
  name: z.string(),
  content: z.string(),
});

export const DeleteSkillCommand = z.object({
  type: z.literal("DELETE_SKILL"),
  name: z.string(),
});

export const DeleteAgentDefCommand = z.object({
  type: z.literal("DELETE_AGENT_DEF"),
  agentDefId: z.string(),
});

export const PickFolderCommand = z.object({
  type: z.literal("PICK_FOLDER"),
  requestId: z.string(),
});

export const UploadImageCommand = z.object({
  type: z.literal("UPLOAD_IMAGE"),
  requestId: z.string(),
  /** base64-encoded image data (without data: prefix) */
  data: z.string(),
  /** Original filename or generated name */
  filename: z.string(),
});

export const SuggestCommand = z.object({
  type: z.literal("SUGGEST"),
  text: z.string().max(500),
  author: z.string().max(30).optional(),
});

export const RateProjectCommand = z.object({
  type: z.literal("RATE_PROJECT"),
  projectId: z.string().optional(),
  ratings: z.record(z.string(), z.number().min(1).max(5)),
});

export const ListProjectsCommand = z.object({
  type: z.literal("LIST_PROJECTS"),
});

export const LoadProjectCommand = z.object({
  type: z.literal("LOAD_PROJECT"),
  projectId: z.string(),
});

export const GetConfigCommand = z.object({
  type: z.literal("GET_CONFIG"),
});

export const SaveConfigCommand = z.object({
  type: z.literal("SAVE_CONFIG"),
  telegramBotToken: z.string().optional(),
  telegramAllowedUsers: z.array(z.string()).optional(),
  worktreeEnabled: z.boolean().optional(),
  autoMergeEnabled: z.boolean().optional(),
  tunnelToken: z.string().optional(),
  tunnelBaseUrl: z.string().optional(),
  defaultBackend: z.string().optional(),
  defaultModels: z.record(z.string(), z.string()).optional(),
  sandboxMode: z.enum(["full", "safe"]).optional(),
  githubToken: z.string().optional(),
  githubRemote: z.string().optional(),
  webhooks: z.array(z.object({
    url: z.string(),
    secret: z.string().optional(),
    events: z.array(z.string()),
    enabled: z.boolean(),
  })).optional(),
});

export const MergeWorktreeCommand = z.object({
  type: z.literal("MERGE_WORKTREE"),
  agentId: z.string(),
});

export const UndoMergeCommand = z.object({
  type: z.literal("UNDO_MERGE"),
  agentId: z.string(),
});

export const RevertWorktreeCommand = z.object({
  type: z.literal("REVERT_WORKTREE"),
  agentId: z.string(),
});

export const ToggleAutoMergeCommand = z.object({
  type: z.literal("TOGGLE_AUTO_MERGE"),
  agentId: z.string(),
  autoMerge: z.boolean(),
});

export const RequestReviewCommand = z.object({
  type: z.literal("REQUEST_REVIEW"),
  /** Frontend-generated reviewer agent ID (so frontend can set up overlay immediately) */
  reviewerAgentId: z.string(),
  sourceAgentId: z.string(),
  changedFiles: z.array(z.string()),
  projectDir: z.string().optional(),
  entryFile: z.string().optional(),
  summary: z.string().optional(),
  backend: z.string().optional(),
});

export const SyncChatHistoryCommand = z.object({
  type: z.literal("SYNC_CHAT_HISTORY"),
  /** Serialized PersistedAgent[] — same format as localStorage office-chat-history */
  data: z.string(),
});

export const LoadChatHistoryCommand = z.object({
  type: z.literal("LOAD_CHAT_HISTORY"),
});

export const GetLogsCommand = z.object({
  type: z.literal("GET_LOGS"),
  lines: z.number().optional(),
});

export const GetMetricsCommand = z.object({
  type: z.literal("GET_METRICS"),
});

export const ClearMetricsCommand = z.object({
  type: z.literal("CLEAR_METRICS"),
});

export const SaveTeamTemplateCommand = z.object({
  type: z.literal("SAVE_TEAM_TEMPLATE"),
  name: z.string(),
  members: z.array(z.object({ defId: z.string(), backend: z.string().optional() })),
  workDir: z.string().optional(),
});

export const ListTeamTemplatesCommand = z.object({
  type: z.literal("LIST_TEAM_TEMPLATES"),
});

export const DeleteTeamTemplateCommand = z.object({
  type: z.literal("DELETE_TEAM_TEMPLATE"),
  name: z.string(),
});

export const ListFilesCommand = z.object({
  type: z.literal("LIST_FILES"),
  path: z.string(),
  depth: z.number().optional(),
});

export const ReadFileCommand = z.object({
  type: z.literal("READ_FILE"),
  path: z.string(),
});

export const GetGitStatusCommand = z.object({
  type: z.literal("GET_GIT_STATUS"),
  path: z.string().optional(),
});

export const GetGitLogCommand = z.object({
  type: z.literal("GET_GIT_LOG"),
  path: z.string().optional(),
  count: z.number().optional(),
});

export const PushBranchCommand = z.object({
  type: z.literal("PUSH_BRANCH"),
  path: z.string().optional(),
  branch: z.string().optional(),
  remote: z.string().optional(),
});

export const CreatePrCommand = z.object({
  type: z.literal("CREATE_PR"),
  path: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  branch: z.string().optional(),
  base: z.string().optional(),
});

export const SavePipelineCommand = z.object({
  type: z.literal("SAVE_PIPELINE"),
  name: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    agentRole: z.string(),
    prompt: z.string(),
    dependsOn: z.array(z.string()).optional(),
  })),
});

export const RunPipelineCommand = z.object({
  type: z.literal("RUN_PIPELINE"),
  name: z.string(),
  input: z.string().optional(),
  workDir: z.string().optional(),
});

export const ListPipelinesCommand = z.object({
  type: z.literal("LIST_PIPELINES"),
});

export const ClearMemoryCommand = z.object({
  type: z.literal("CLEAR_MEMORY"),
});

export const ResetConfigCommand = z.object({
  type: z.literal("RESET_CONFIG"),
});

export const GetFileDiffCommand = z.object({
  type: z.literal("GET_FILE_DIFF"),
  path: z.string().optional(),
  file: z.string(),
});

export const SwitchWorkspaceCommand = z.object({
  type: z.literal("SWITCH_WORKSPACE"),
  path: z.string(),
});

export const CreateScheduleCommand = z.object({
  type: z.literal("CREATE_SCHEDULE"),
  name: z.string(),
  agentId: z.string(),
  prompt: z.string(),
  intervalMinutes: z.number(),
  workDir: z.string().optional(),
});

export const DeleteScheduleCommand = z.object({
  type: z.literal("DELETE_SCHEDULE"),
  id: z.string(),
});

export const ToggleScheduleCommand = z.object({
  type: z.literal("TOGGLE_SCHEDULE"),
  id: z.string(),
});

export const ListSchedulesCommand = z.object({
  type: z.literal("LIST_SCHEDULES"),
});

export const ListCommandsCommand = z.object({
  type: z.literal("LIST_COMMANDS"),
});

export const CommandSchema = z.discriminatedUnion("type", [
  RunTaskCommand,
  ApprovalDecisionCommand,
  CancelTaskCommand,
  PingCommand,
  CreateAgentCommand,
  FireAgentCommand,
  OpenFileCommand,
  CreateTeamCommand,
  ServePreviewCommand,
  StopTeamCommand,
  FireTeamCommand,
  KillExternalCommand,
  ApprovePlanCommand,
  EndProjectCommand,
  SaveAgentDefCommand,
  DeleteAgentDefCommand,
  PickFolderCommand,
  UploadImageCommand,
  SuggestCommand,
  RateProjectCommand,
  ListProjectsCommand,
  LoadProjectCommand,
  RequestReviewCommand,
  MergeWorktreeCommand,
  UndoMergeCommand,
  RevertWorktreeCommand,
  ToggleAutoMergeCommand,
  GetConfigCommand,
  SaveConfigCommand,
  ListSkillsCommand,
  SaveSkillCommand,
  DeleteSkillCommand,
  SyncChatHistoryCommand,
  LoadChatHistoryCommand,
  GetLogsCommand,
  GetMetricsCommand,
  ClearMetricsCommand,
  SaveTeamTemplateCommand,
  ListTeamTemplatesCommand,
  DeleteTeamTemplateCommand,
  ListFilesCommand,
  ReadFileCommand,
  GetGitStatusCommand,
  GetGitLogCommand,
  PushBranchCommand,
  CreatePrCommand,
  SavePipelineCommand,
  RunPipelineCommand,
  ListPipelinesCommand,
  ClearMemoryCommand,
  ResetConfigCommand,
  GetFileDiffCommand,
  SwitchWorkspaceCommand,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  ToggleScheduleCommand,
  ListSchedulesCommand,
  ListCommandsCommand,
]);

export type RunTaskCommand = z.infer<typeof RunTaskCommand>;
export type ApprovalDecisionCommand = z.infer<typeof ApprovalDecisionCommand>;
export type CancelTaskCommand = z.infer<typeof CancelTaskCommand>;
export type PingCommand = z.infer<typeof PingCommand>;
export type CreateAgentCommand = z.infer<typeof CreateAgentCommand>;
export type FireAgentCommand = z.infer<typeof FireAgentCommand>;
export type OpenFileCommand = z.infer<typeof OpenFileCommand>;
export type CreateTeamCommand = z.infer<typeof CreateTeamCommand>;
export type ServePreviewCommand = z.infer<typeof ServePreviewCommand>;
export type StopTeamCommand = z.infer<typeof StopTeamCommand>;
export type FireTeamCommand = z.infer<typeof FireTeamCommand>;
export type KillExternalCommand = z.infer<typeof KillExternalCommand>;
export type ApprovePlanCommand = z.infer<typeof ApprovePlanCommand>;
export type EndProjectCommand = z.infer<typeof EndProjectCommand>;
export type SaveAgentDefCommand = z.infer<typeof SaveAgentDefCommand>;
export type DeleteAgentDefCommand = z.infer<typeof DeleteAgentDefCommand>;
export type PickFolderCommand = z.infer<typeof PickFolderCommand>;
export type UploadImageCommand = z.infer<typeof UploadImageCommand>;
export type SuggestCommand = z.infer<typeof SuggestCommand>;
export type RateProjectCommand = z.infer<typeof RateProjectCommand>;
export type ListProjectsCommand = z.infer<typeof ListProjectsCommand>;
export type LoadProjectCommand = z.infer<typeof LoadProjectCommand>;
export type RequestReviewCommand = z.infer<typeof RequestReviewCommand>;
export type GetConfigCommand = z.infer<typeof GetConfigCommand>;
export type MergeWorktreeCommand = z.infer<typeof MergeWorktreeCommand>;
export type UndoMergeCommand = z.infer<typeof UndoMergeCommand>;
export type RevertWorktreeCommand = z.infer<typeof RevertWorktreeCommand>;
export type ToggleAutoMergeCommand = z.infer<typeof ToggleAutoMergeCommand>;
export type SaveConfigCommand = z.infer<typeof SaveConfigCommand>;
export type ListSkillsCommand = z.infer<typeof ListSkillsCommand>;
export type SaveSkillCommand = z.infer<typeof SaveSkillCommand>;
export type DeleteSkillCommand = z.infer<typeof DeleteSkillCommand>;
export type GetLogsCommand = z.infer<typeof GetLogsCommand>;
export type GetMetricsCommand = z.infer<typeof GetMetricsCommand>;
export type ClearMetricsCommand = z.infer<typeof ClearMetricsCommand>;
export type SaveTeamTemplateCommand = z.infer<typeof SaveTeamTemplateCommand>;
export type ListTeamTemplatesCommand = z.infer<typeof ListTeamTemplatesCommand>;
export type DeleteTeamTemplateCommand = z.infer<typeof DeleteTeamTemplateCommand>;
export type ListFilesCommand = z.infer<typeof ListFilesCommand>;
export type ReadFileCommand = z.infer<typeof ReadFileCommand>;
export type GetGitStatusCommand = z.infer<typeof GetGitStatusCommand>;
export type GetGitLogCommand = z.infer<typeof GetGitLogCommand>;
export type PushBranchCommand = z.infer<typeof PushBranchCommand>;
export type CreatePrCommand = z.infer<typeof CreatePrCommand>;
export type SavePipelineCommand = z.infer<typeof SavePipelineCommand>;
export type RunPipelineCommand = z.infer<typeof RunPipelineCommand>;
export type ListPipelinesCommand = z.infer<typeof ListPipelinesCommand>;
export type ClearMemoryCommand = z.infer<typeof ClearMemoryCommand>;
export type ResetConfigCommand = z.infer<typeof ResetConfigCommand>;
export type GetFileDiffCommand = z.infer<typeof GetFileDiffCommand>;
export type SwitchWorkspaceCommand = z.infer<typeof SwitchWorkspaceCommand>;
export type CreateScheduleCommand = z.infer<typeof CreateScheduleCommand>;
export type DeleteScheduleCommand = z.infer<typeof DeleteScheduleCommand>;
export type ToggleScheduleCommand = z.infer<typeof ToggleScheduleCommand>;
export type ListSchedulesCommand = z.infer<typeof ListSchedulesCommand>;
export type ListCommandsCommand = z.infer<typeof ListCommandsCommand>;
export type Command = z.infer<typeof CommandSchema>;
