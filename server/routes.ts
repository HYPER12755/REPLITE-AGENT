import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamingService } from "./websocket";
import { githubService } from "./github";
import { storageManager } from "./storage-providers";
import {
  insertSessionSchema,
  insertTaskSchema,
  insertMessageSchema,
  insertToolSchema,
  insertArtifactSchema,
  insertRepositorySchema,
  type TaskPlan,
  taskPlanSchema,
} from "@shared/schema";
import { z } from "zod";

// Default session for development
let defaultSessionId: string | null = null;

async function getOrCreateDefaultSession() {
  if (defaultSessionId) {
    const session = await storage.getSession(defaultSessionId);
    if (session) return session;
  }

  // Create a new default session
  const session = await storage.createSession({
    name: "Development Session",
    status: "idle",
    dryRunMode: true,
    allowDestructive: false,
    workspaceDir: process.cwd(),
  });
  defaultSessionId = session.id;
  return session;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize WebSocket streaming service
  streamingService.initialize(httpServer);

  // ============================================
  // SESSION ROUTES
  // ============================================

  // Get current session (creates default if none exists)
  app.get("/api/sessions/current", async (req, res) => {
    try {
      const session = await getOrCreateDefaultSession();
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get session by ID
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new session
  app.post("/api/sessions", async (req, res) => {
    try {
      const data = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(data);
      res.status(201).json(session);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update session
  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Emergency stop session
  app.post("/api/sessions/:id/stop", async (req, res) => {
    try {
      const session = await storage.updateSession(req.params.id, {
        status: "idle",
      });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Cancel all running tasks
      const tasks = await storage.getTasksBySession(req.params.id);
      for (const task of tasks) {
        if (task.status === "running") {
          await storage.updateTask(task.id, { status: "cancelled" });
        }
      }

      streamingService.sendLogLine(
        req.params.id,
        null,
        "Emergency stop triggered - all processes terminated",
        "warn"
      );

      res.json({ message: "Session stopped", session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // MESSAGES ROUTES (Chat)
  // ============================================

  // Get messages for session
  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesBySession(req.params.sessionId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send message (triggers agent processing)
  app.post("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        sessionId: req.params.sessionId,
        role: "user",
        content,
      });

      // Stream acknowledgment
      streamingService.sendLogLine(
        req.params.sessionId,
        null,
        `Received message: "${content.substring(0, 50)}..."`,
        "info"
      );

      // TODO: Integrate with OpenAI for LLM planning
      // For now, create a mock agent response
      const agentMessage = await storage.createMessage({
        sessionId: req.params.sessionId,
        role: "assistant",
        content: `I'll help you with: "${content}". Let me create a task plan for this.`,
      });

      // Create a task based on the message
      const task = await storage.createTask({
        sessionId: req.params.sessionId,
        title: content.substring(0, 100),
        description: content,
        status: "pending",
        plan: [
          { action: "check_tool", target: "git", description: "Check if git is available" },
          { action: "shell_exec", target: "echo", args: { command: "echo 'Task executed'" }, description: "Execute command" },
        ],
        currentStep: 0,
        totalSteps: 2,
      });

      res.status(201).json({
        userMessage,
        agentMessage,
        task,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // TASKS ROUTES
  // ============================================

  // Get tasks for session
  app.get("/api/sessions/:sessionId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksBySession(req.params.sessionId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get task by ID
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Run task
  app.post("/api/tasks/:id/run", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Update task status
      const updatedTask = await storage.updateTask(task.id, {
        status: "running",
        currentStep: 0,
      });

      streamingService.sendTaskStart(task.sessionId, task.id, task.title);

      // TODO: Actually execute the task plan
      // For now, simulate task execution
      const plan = (task.plan as any[]) || [];
      for (let i = 0; i < plan.length; i++) {
        streamingService.sendTaskStep(
          task.sessionId,
          task.id,
          i,
          plan.length,
          plan[i].action
        );
        await storage.updateTask(task.id, { currentStep: i + 1 });
      }

      await storage.updateTask(task.id, { status: "completed" });
      streamingService.sendTaskComplete(task.sessionId, task.id, true);

      res.json(updatedTask);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel task
  app.post("/api/tasks/:id/cancel", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, {
        status: "cancelled",
      });
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      streamingService.sendLogLine(
        task.sessionId,
        task.id,
        "Task cancelled by user",
        "warn"
      );

      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // TOOLS ROUTES
  // ============================================

  // List all tools
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      
      // If no tools exist, seed with some defaults
      if (tools.length === 0) {
        const defaultTools = [
          { name: "git", type: "shell", description: "Git version control", isInstalled: true, command: "git" },
          { name: "npm", type: "shell", description: "Node package manager", isInstalled: true, command: "npm" },
          { name: "python", type: "python", description: "Python interpreter", isInstalled: true, command: "python3" },
          { name: "curl", type: "shell", description: "HTTP client", isInstalled: true, command: "curl" },
          { name: "yt-dlp", type: "shell", description: "Video downloader", isInstalled: false, installCommand: "pip install yt-dlp" },
          { name: "ffmpeg", type: "shell", description: "Media processing", isInstalled: false, installCommand: "apt install ffmpeg" },
        ];
        
        for (const tool of defaultTools) {
          await storage.createTool(tool);
        }
        
        const seededTools = await storage.getAllTools();
        return res.json(seededTools);
      }
      
      res.json(tools);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register new tool
  app.post("/api/tools", async (req, res) => {
    try {
      const data = insertToolSchema.parse(req.body);
      const tool = await storage.createTool(data);
      res.status(201).json(tool);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get tool by ID
  app.get("/api/tools/:id", async (req, res) => {
    try {
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      res.json(tool);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Install tool
  app.post("/api/tools/:id/install", async (req, res) => {
    try {
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }

      // TODO: Actually run the install command
      // For now, just mark as installed
      const updatedTool = await storage.updateTool(tool.id, {
        isInstalled: true,
        version: "1.0.0",
      });

      res.json(updatedTool);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Call tool
  app.post("/api/tools/:id/call", async (req, res) => {
    try {
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }

      if (!tool.isInstalled) {
        return res.status(400).json({ error: "Tool is not installed" });
      }

      // TODO: Execute the tool with provided args
      const { args } = req.body;

      res.json({
        tool: tool.name,
        args,
        result: "Tool executed successfully",
        output: "",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ARTIFACTS ROUTES
  // ============================================

  // Get artifacts for session
  app.get("/api/sessions/:sessionId/artifacts", async (req, res) => {
    try {
      const artifacts = await storage.getArtifactsBySession(req.params.sessionId);
      res.json(artifacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload artifact
  app.post("/api/sessions/:sessionId/artifacts", async (req, res) => {
    try {
      const { name, path: filePath, provider = "local" } = req.body;

      // Save to storage provider
      const ref = await storageManager.saveArtifact(
        req.params.sessionId,
        filePath,
        { name }
      );

      // Save to database
      const artifact = await storage.createArtifact({
        sessionId: req.params.sessionId,
        name,
        path: filePath,
        provider: ref.provider,
        providerRef: ref.ref,
        metadata: ref.metadata,
      });

      res.status(201).json(artifact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete artifact
  app.delete("/api/artifacts/:id", async (req, res) => {
    try {
      const artifact = await storage.getArtifact(req.params.id);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }

      // Delete from storage provider
      await storageManager.deleteArtifact({
        provider: artifact.provider,
        ref: artifact.providerRef || "",
      });

      // Delete from database
      await storage.deleteArtifact(req.params.id);

      res.json({ message: "Artifact deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // REPOSITORIES ROUTES (GitHub)
  // ============================================

  // Get repositories for session
  app.get("/api/sessions/:sessionId/repositories", async (req, res) => {
    try {
      const repositories = await storage.getRepositoriesBySession(req.params.sessionId);
      res.json(repositories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clone repository
  app.post("/api/sessions/:sessionId/repositories", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Repository URL is required" });
      }

      // Parse repository info from URL
      const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (!match) {
        return res.status(400).json({ error: "Invalid GitHub repository URL" });
      }

      const [, owner, name] = match;
      const fullName = `${owner}/${name}`;

      // Create repository record
      const repository = await storage.createRepository({
        sessionId: req.params.sessionId,
        owner,
        name,
        fullName,
        cloneUrl: url,
        defaultBranch: "main",
        currentBranch: "main",
        localPath: `./repos/${fullName.replace("/", "-")}`,
      });

      streamingService.sendLogLine(
        req.params.sessionId,
        null,
        `Repository cloned: ${fullName}`,
        "info"
      );

      res.status(201).json(repository);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get GitHub user info
  app.get("/api/github/user", async (req, res) => {
    try {
      const user = await githubService.getAuthenticatedUser();
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List GitHub repositories
  app.get("/api/github/repos", async (req, res) => {
    try {
      const repos = await githubService.listRepositories();
      res.json(repos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get branches for repository
  app.get("/api/github/repos/:owner/:repo/branches", async (req, res) => {
    try {
      const branches = await githubService.listBranches(
        req.params.owner,
        req.params.repo
      );
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create branch
  app.post("/api/github/repos/:owner/:repo/branches", async (req, res) => {
    try {
      const { name, from } = req.body;
      const branch = await githubService.createBranch(
        req.params.owner,
        req.params.repo,
        name,
        from
      );
      res.status(201).json({ branch });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create pull request
  app.post("/api/github/repos/:owner/:repo/pulls", async (req, res) => {
    try {
      const { title, body, head, base } = req.body;
      const pr = await githubService.createPullRequest(
        req.params.owner,
        req.params.repo,
        title,
        body,
        head,
        base || "main"
      );
      res.status(201).json(pr);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // APPROVALS ROUTES
  // ============================================

  // Get pending approvals for session
  app.get("/api/sessions/:sessionId/approvals", async (req, res) => {
    try {
      const approvals = await storage.getPendingApprovals(req.params.sessionId);
      res.json(approvals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resolve approval
  app.post("/api/approvals/:id/resolve", async (req, res) => {
    try {
      const { approved, dontAskAgain } = req.body;
      const status = approved ? "approved" : "rejected";

      const approval = await storage.resolveApproval(req.params.id, status);
      if (!approval) {
        return res.status(404).json({ error: "Approval not found" });
      }

      streamingService.sendApprovalResolved(approval.sessionId, approval.id, status);

      res.json(approval);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // STORAGE PROVIDERS ROUTES
  // ============================================

  // List storage providers
  app.get("/api/storage/providers", async (req, res) => {
    try {
      const providers = storageManager.listProviders();
      res.json(providers.map((name) => ({ name, connected: true })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
