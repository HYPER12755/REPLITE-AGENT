import {
  users,
  sessions,
  tasks,
  messages,
  tools,
  artifacts,
  logEntries,
  repositories,
  approvals,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type Task,
  type InsertTask,
  type Message,
  type InsertMessage,
  type Tool,
  type InsertTool,
  type Artifact,
  type InsertArtifact,
  type LogEntry,
  type InsertLogEntry,
  type Repository,
  type InsertRepository,
  type Approval,
  type InsertApproval,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  getSessionsByUser(userId: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasksBySession(sessionId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Tools
  getTool(id: string): Promise<Tool | undefined>;
  getToolByName(name: string): Promise<Tool | undefined>;
  getAllTools(): Promise<Tool[]>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, updates: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<void>;

  // Artifacts
  getArtifact(id: string): Promise<Artifact | undefined>;
  getArtifactsBySession(sessionId: string): Promise<Artifact[]>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  deleteArtifact(id: string): Promise<void>;

  // Log Entries
  getLogEntriesBySession(sessionId: string, limit?: number): Promise<LogEntry[]>;
  getLogEntriesByTask(taskId: string): Promise<LogEntry[]>;
  createLogEntry(logEntry: InsertLogEntry): Promise<LogEntry>;
  deleteLogEntriesBySession(sessionId: string): Promise<void>;

  // Repositories
  getRepository(id: string): Promise<Repository | undefined>;
  getRepositoriesBySession(sessionId: string): Promise<Repository[]>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  updateRepository(id: string, updates: Partial<InsertRepository>): Promise<Repository | undefined>;
  deleteRepository(id: string): Promise<void>;

  // Approvals
  getApproval(id: string): Promise<Approval | undefined>;
  getPendingApprovals(sessionId: string): Promise<Approval[]>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  resolveApproval(id: string, status: "approved" | "rejected"): Promise<Approval | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async getSessionsByUser(userId: string): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.createdAt));
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async updateSession(id: string, updates: Partial<InsertSession>): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksBySession(sessionId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.sessionId, sessionId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  // Tools
  async getTool(id: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool || undefined;
  }

  async getToolByName(name: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.name, name));
    return tool || undefined;
  }

  async getAllTools(): Promise<Tool[]> {
    return db.select().from(tools).orderBy(tools.name);
  }

  async createTool(insertTool: InsertTool): Promise<Tool> {
    const [tool] = await db.insert(tools).values(insertTool).returning();
    return tool;
  }

  async updateTool(id: string, updates: Partial<InsertTool>): Promise<Tool | undefined> {
    const [tool] = await db.update(tools).set(updates).where(eq(tools.id, id)).returning();
    return tool || undefined;
  }

  async deleteTool(id: string): Promise<void> {
    await db.delete(tools).where(eq(tools.id, id));
  }

  // Artifacts
  async getArtifact(id: string): Promise<Artifact | undefined> {
    const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id, id));
    return artifact || undefined;
  }

  async getArtifactsBySession(sessionId: string): Promise<Artifact[]> {
    return db.select().from(artifacts).where(eq(artifacts.sessionId, sessionId)).orderBy(desc(artifacts.createdAt));
  }

  async createArtifact(insertArtifact: InsertArtifact): Promise<Artifact> {
    const [artifact] = await db.insert(artifacts).values(insertArtifact).returning();
    return artifact;
  }

  async deleteArtifact(id: string): Promise<void> {
    await db.delete(artifacts).where(eq(artifacts.id, id));
  }

  // Log Entries
  async getLogEntriesBySession(sessionId: string, limit = 1000): Promise<LogEntry[]> {
    return db
      .select()
      .from(logEntries)
      .where(eq(logEntries.sessionId, sessionId))
      .orderBy(desc(logEntries.timestamp))
      .limit(limit);
  }

  async getLogEntriesByTask(taskId: string): Promise<LogEntry[]> {
    return db.select().from(logEntries).where(eq(logEntries.taskId, taskId)).orderBy(logEntries.timestamp);
  }

  async createLogEntry(insertLogEntry: InsertLogEntry): Promise<LogEntry> {
    const [logEntry] = await db.insert(logEntries).values(insertLogEntry).returning();
    return logEntry;
  }

  async deleteLogEntriesBySession(sessionId: string): Promise<void> {
    await db.delete(logEntries).where(eq(logEntries.sessionId, sessionId));
  }

  // Repositories
  async getRepository(id: string): Promise<Repository | undefined> {
    const [repository] = await db.select().from(repositories).where(eq(repositories.id, id));
    return repository || undefined;
  }

  async getRepositoriesBySession(sessionId: string): Promise<Repository[]> {
    return db.select().from(repositories).where(eq(repositories.sessionId, sessionId));
  }

  async createRepository(insertRepository: InsertRepository): Promise<Repository> {
    const [repository] = await db.insert(repositories).values(insertRepository).returning();
    return repository;
  }

  async updateRepository(id: string, updates: Partial<InsertRepository>): Promise<Repository | undefined> {
    const [repository] = await db.update(repositories).set(updates).where(eq(repositories.id, id)).returning();
    return repository || undefined;
  }

  async deleteRepository(id: string): Promise<void> {
    await db.delete(repositories).where(eq(repositories.id, id));
  }

  // Approvals
  async getApproval(id: string): Promise<Approval | undefined> {
    const [approval] = await db.select().from(approvals).where(eq(approvals.id, id));
    return approval || undefined;
  }

  async getPendingApprovals(sessionId: string): Promise<Approval[]> {
    return db
      .select()
      .from(approvals)
      .where(and(eq(approvals.sessionId, sessionId), eq(approvals.status, "pending")));
  }

  async createApproval(insertApproval: InsertApproval): Promise<Approval> {
    const [approval] = await db.insert(approvals).values(insertApproval).returning();
    return approval;
  }

  async resolveApproval(id: string, status: "approved" | "rejected"): Promise<Approval | undefined> {
    const [approval] = await db
      .update(approvals)
      .set({ status, resolvedAt: new Date() })
      .where(eq(approvals.id, id))
      .returning();
    return approval || undefined;
  }
}

export const storage = new DatabaseStorage();
