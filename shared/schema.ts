import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for multi-user support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  githubId: text("github_id"),
  role: text("role").notNull().default("dev"), // admin, dev, readonly
  createdAt: timestamp("created_at").defaultNow(),
});

// Sessions table for tracking agent work sessions
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("idle"), // idle, running, paused, completed, failed
  dryRunMode: boolean("dry_run_mode").notNull().default(true),
  allowDestructive: boolean("allow_destructive").notNull().default(false),
  workspaceDir: text("workspace_dir"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table for tracking planned agent tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  plan: jsonb("plan"), // JSON array of action steps
  currentStep: integer("current_step").default(0),
  totalSteps: integer("total_steps").default(0),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table for chat history
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tools registry table
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // shell, python, api, docker, container-run
  description: text("description"),
  command: text("command"), // Command template for shell/python tools
  apiEndpoint: text("api_endpoint"), // For API tools
  dockerImage: text("docker_image"), // For docker tools
  schema: jsonb("schema"), // JSON Schema for tool parameters
  isInstalled: boolean("is_installed").default(false),
  installCommand: text("install_command"),
  version: text("version"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Artifacts table for storage management
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  size: integer("size"),
  mimeType: text("mime_type"),
  provider: text("provider").notNull(), // local, s3, gcs, azure, dropbox, gdrive, ipfs
  providerRef: text("provider_ref"), // Provider-specific reference (S3 key, etc.)
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Log entries for streaming
export const logEntries = pgTable("log_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  taskId: varchar("task_id").references(() => tasks.id),
  level: text("level").notNull(), // info, warn, error, debug
  message: text("message").notNull(),
  source: text("source"), // stdout, stderr, system
  timestamp: timestamp("timestamp").defaultNow(),
});

// GitHub repositories linked to sessions
export const repositories = pgTable("repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  cloneUrl: text("clone_url"),
  defaultBranch: text("default_branch").default("main"),
  currentBranch: text("current_branch"),
  localPath: text("local_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pending approvals for destructive operations
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  taskId: varchar("task_id").references(() => tasks.id),
  action: text("action").notNull(),
  details: jsonb("details"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
  messages: many(messages),
  artifacts: many(artifacts),
  logEntries: many(logEntries),
  repositories: many(repositories),
  approvals: many(approvals),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  session: one(sessions, {
    fields: [tasks.sessionId],
    references: [sessions.id],
  }),
  logEntries: many(logEntries),
  approvals: many(approvals),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(sessions, {
    fields: [messages.sessionId],
    references: [sessions.id],
  }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  session: one(sessions, {
    fields: [artifacts.sessionId],
    references: [sessions.id],
  }),
}));

export const logEntriesRelations = relations(logEntries, ({ one }) => ({
  session: one(sessions, {
    fields: [logEntries.sessionId],
    references: [sessions.id],
  }),
  task: one(tasks, {
    fields: [logEntries.taskId],
    references: [tasks.id],
  }),
}));

export const repositoriesRelations = relations(repositories, ({ one }) => ({
  session: one(sessions, {
    fields: [repositories.sessionId],
    references: [sessions.id],
  }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  session: one(sessions, {
    fields: [approvals.sessionId],
    references: [sessions.id],
  }),
  task: one(tasks, {
    fields: [approvals.taskId],
    references: [tasks.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
});

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  createdAt: true,
});

export const insertLogEntrySchema = createInsertSchema(logEntries).omit({
  id: true,
  timestamp: true,
});

export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  createdAt: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;

export type InsertArtifact = z.infer<typeof insertArtifactSchema>;
export type Artifact = typeof artifacts.$inferSelect;

export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;
export type LogEntry = typeof logEntries.$inferSelect;

export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositories.$inferSelect;

export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvals.$inferSelect;

// Action step schema for LLM planning
export const actionStepSchema = z.object({
  action: z.enum([
    "check_tool",
    "install_tool",
    "call_tool",
    "read_file",
    "write_file",
    "delete_file",
    "git_clone",
    "git_commit",
    "git_push",
    "git_create_branch",
    "git_create_pr",
    "save_artifact",
    "get_artifact",
    "shell_exec",
    "python_exec",
    "docker_run",
    "wait_approval",
  ]),
  target: z.string().optional(),
  args: z.record(z.any()).optional(),
  description: z.string().optional(),
});

export const taskPlanSchema = z.array(actionStepSchema);

export type ActionStep = z.infer<typeof actionStepSchema>;
export type TaskPlan = z.infer<typeof taskPlanSchema>;

// WebSocket event types for streaming
export type StreamEventType = 
  | "session_start"
  | "session_end"
  | "task_start"
  | "task_step"
  | "task_complete"
  | "task_error"
  | "log_line"
  | "stdout"
  | "stderr"
  | "approval_required"
  | "approval_resolved";

export interface StreamEvent {
  type: StreamEventType;
  sessionId: string;
  taskId?: string;
  timestamp: string;
  data: Record<string, any>;
}
