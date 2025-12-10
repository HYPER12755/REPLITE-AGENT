// WebSocket server for real-time streaming - Reference: javascript_websocket blueprint
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { StreamEvent } from "@shared/schema";

interface WebSocketClient {
  ws: WebSocket;
  sessionId: string;
  userId?: string;
}

class StreamingService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient[]> = new Map();

  initialize(httpServer: Server): void {
    // Create WebSocket server on distinct path to avoid conflict with Vite HMR
    this.wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const sessionId = url.searchParams.get("sessionId") || "default";
      const userId = url.searchParams.get("userId") || undefined;

      const client: WebSocketClient = { ws, sessionId, userId };
      this.addClient(sessionId, client);

      console.log(`WebSocket client connected for session: ${sessionId}`);

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(client, data);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      });

      ws.on("close", () => {
        this.removeClient(sessionId, client);
        console.log(`WebSocket client disconnected from session: ${sessionId}`);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.removeClient(sessionId, client);
      });

      // Send connection acknowledgment
      this.sendToClient(client, {
        type: "session_start",
        sessionId,
        timestamp: new Date().toISOString(),
        data: { message: "Connected to streaming service" },
      });
    });

    console.log("WebSocket streaming service initialized on /ws");
  }

  private addClient(sessionId: string, client: WebSocketClient): void {
    const clients = this.clients.get(sessionId) || [];
    clients.push(client);
    this.clients.set(sessionId, clients);
  }

  private removeClient(sessionId: string, client: WebSocketClient): void {
    const clients = this.clients.get(sessionId) || [];
    const filtered = clients.filter((c) => c.ws !== client.ws);
    if (filtered.length > 0) {
      this.clients.set(sessionId, filtered);
    } else {
      this.clients.delete(sessionId);
    }
  }

  private handleClientMessage(client: WebSocketClient, data: any): void {
    // Handle client commands (e.g., subscribe to specific task)
    switch (data.type) {
      case "subscribe_task":
        // Client wants to subscribe to a specific task's events
        break;
      case "ping":
        this.sendToClient(client, {
          type: "session_start",
          sessionId: client.sessionId,
          timestamp: new Date().toISOString(),
          data: { pong: true },
        });
        break;
    }
  }

  private sendToClient(client: WebSocketClient, event: StreamEvent): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(event));
    }
  }

  // Broadcast event to all clients in a session
  broadcast(sessionId: string, event: StreamEvent): void {
    const clients = this.clients.get(sessionId) || [];
    const message = JSON.stringify(event);

    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  }

  // Send log line event
  sendLogLine(sessionId: string, taskId: string | null, message: string, level = "info"): void {
    this.broadcast(sessionId, {
      type: "log_line",
      sessionId,
      taskId: taskId || undefined,
      timestamp: new Date().toISOString(),
      data: { message, level },
    });
  }

  // Send stdout event
  sendStdout(sessionId: string, taskId: string, output: string): void {
    this.broadcast(sessionId, {
      type: "stdout",
      sessionId,
      taskId,
      timestamp: new Date().toISOString(),
      data: { message: output },
    });
  }

  // Send stderr event
  sendStderr(sessionId: string, taskId: string, output: string): void {
    this.broadcast(sessionId, {
      type: "stderr",
      sessionId,
      taskId,
      timestamp: new Date().toISOString(),
      data: { message: output },
    });
  }

  // Send task start event
  sendTaskStart(sessionId: string, taskId: string, taskTitle: string): void {
    this.broadcast(sessionId, {
      type: "task_start",
      sessionId,
      taskId,
      timestamp: new Date().toISOString(),
      data: { title: taskTitle },
    });
  }

  // Send task step event
  sendTaskStep(
    sessionId: string,
    taskId: string,
    stepIndex: number,
    totalSteps: number,
    action: string
  ): void {
    this.broadcast(sessionId, {
      type: "task_step",
      sessionId,
      taskId,
      timestamp: new Date().toISOString(),
      data: { stepIndex, totalSteps, action },
    });
  }

  // Send task complete event
  sendTaskComplete(sessionId: string, taskId: string, success: boolean): void {
    this.broadcast(sessionId, {
      type: "task_complete",
      sessionId,
      taskId,
      timestamp: new Date().toISOString(),
      data: { success },
    });
  }

  // Send task error event
  sendTaskError(sessionId: string, taskId: string, error: string): void {
    this.broadcast(sessionId, {
      type: "task_error",
      sessionId,
      taskId,
      timestamp: new Date().toISOString(),
      data: { error },
    });
  }

  // Send approval required event
  sendApprovalRequired(sessionId: string, taskId: string, approval: any): void {
    this.broadcast(sessionId, {
      type: "approval_required",
      sessionId,
      taskId,
      timestamp: new Date().toISOString(),
      data: { approval },
    });
  }

  // Send approval resolved event
  sendApprovalResolved(sessionId: string, approvalId: string, status: string): void {
    this.broadcast(sessionId, {
      type: "approval_resolved",
      sessionId,
      timestamp: new Date().toISOString(),
      data: { approvalId, status },
    });
  }

  // Get connected client count for a session
  getClientCount(sessionId: string): number {
    return (this.clients.get(sessionId) || []).length;
  }

  // Get all connected sessions
  getConnectedSessions(): string[] {
    return Array.from(this.clients.keys());
  }
}

export const streamingService = new StreamingService();
