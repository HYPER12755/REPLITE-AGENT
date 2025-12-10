import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Workspace } from "@/components/Workspace";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Session,
  Message,
  Task,
  Tool,
  LogEntry,
  Artifact,
  Repository,
  Approval,
  StreamEvent,
} from "@shared/schema";

export default function Home() {
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [currentApproval, setCurrentApproval] = useState<Approval | null>(null);
  const [isMessageLoading, setIsMessageLoading] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery<Session>({
    queryKey: ["/api/sessions/current"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/sessions", session?.id, "messages"],
    enabled: !!session?.id,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/sessions", session?.id, "tasks"],
    enabled: !!session?.id,
  });

  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const { data: artifacts = [] } = useQuery<Artifact[]>({
    queryKey: ["/api/sessions", session?.id, "artifacts"],
    enabled: !!session?.id,
  });

  const { data: repositories = [] } = useQuery<Repository[]>({
    queryKey: ["/api/sessions", session?.id, "repositories"],
    enabled: !!session?.id,
  });

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case "log_line":
      case "stdout":
      case "stderr":
        setLocalLogs((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}`,
            sessionId: event.sessionId,
            taskId: event.taskId || null,
            level: event.type === "stderr" ? "error" : "info",
            message: event.data.message || "",
            source: event.type,
            timestamp: new Date(event.timestamp),
          },
        ]);
        break;
      case "task_step":
      case "task_complete":
      case "task_error":
        queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "tasks"] });
        break;
      case "approval_required":
        setCurrentApproval(event.data.approval as Approval);
        break;
      case "approval_resolved":
        setCurrentApproval(null);
        break;
    }
  }, [session?.id]);

  const { status: connectionStatus } = useWebSocket({
    sessionId: session?.id || "default",
    onEvent: handleStreamEvent,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/sessions/${session?.id}/messages`, { content });
    },
    onMutate: (content) => {
      setIsMessageLoading(true);
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sessionId: session?.id || "",
        role: "user",
        content,
        metadata: null,
        createdAt: new Date(),
      };
      setLocalMessages((prev) => [...prev, tempMessage]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "messages"] });
      setIsMessageLoading(false);
    },
    onError: () => {
      setIsMessageLoading(false);
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<Session>) => {
      return apiRequest("PATCH", `/api/sessions/${session?.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/current"] });
    },
  });

  const runTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("POST", `/api/tasks/${taskId}/run`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "tasks"] });
    },
  });

  const cancelTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("POST", `/api/tasks/${taskId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "tasks"] });
    },
  });

  const installToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      return apiRequest("POST", `/api/tools/${toolId}/install`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ approvalId, approved, dontAskAgain }: { approvalId: string; approved: boolean; dontAskAgain: boolean }) => {
      return apiRequest("POST", `/api/approvals/${approvalId}/resolve`, { approved, dontAskAgain });
    },
    onSuccess: () => {
      setCurrentApproval(null);
    },
  });

  const cloneRepoMutation = useMutation({
    mutationFn: async (url: string) => {
      return apiRequest("POST", `/api/sessions/${session?.id}/repositories`, { url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "repositories"] });
    },
  });

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/sessions/${session?.id}/stop`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "tasks"] });
    },
  });

  const handleCommand = useCallback((command: string) => {
    setLocalLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        sessionId: session?.id || "",
        taskId: null,
        level: "info",
        message: `$ ${command}`,
        source: "stdin",
        timestamp: new Date(),
      },
    ]);
  }, [session?.id]);

  const handleClearLogs = useCallback(() => {
    setLocalLogs([]);
  }, []);

  if (sessionLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-12 border-b border-border flex items-center px-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 flex">
          <div className="w-14 border-r border-border">
            <div className="p-2 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const defaultSession: Session = session || {
    id: "default",
    userId: null,
    name: "New Session",
    status: "idle",
    dryRunMode: true,
    allowDestructive: false,
    workspaceDir: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const allMessages = [...messages, ...localMessages.filter(
    (lm) => !messages.some((m) => m.id === lm.id)
  )];

  return (
    <Workspace
      session={defaultSession}
      messages={allMessages}
      tasks={tasks}
      tools={tools}
      logs={localLogs}
      artifacts={artifacts}
      repositories={repositories}
      currentApproval={currentApproval}
      connectionStatus={connectionStatus}
      isMessageLoading={isMessageLoading || sendMessageMutation.isPending}
      onSendMessage={(content) => sendMessageMutation.mutate(content)}
      onStopGeneration={() => {}}
      onDryRunToggle={(enabled) => updateSessionMutation.mutate({ dryRunMode: enabled })}
      onRunTask={(taskId) => runTaskMutation.mutate(taskId)}
      onCancelTask={(taskId) => cancelTaskMutation.mutate(taskId)}
      onRetryTask={(taskId) => runTaskMutation.mutate(taskId)}
      onInstallTool={(toolId) => installToolMutation.mutate(toolId)}
      onApprove={(approvalId, dontAskAgain) =>
        approvalMutation.mutate({ approvalId, approved: true, dontAskAgain })
      }
      onReject={(approvalId) =>
        approvalMutation.mutate({ approvalId, approved: false, dontAskAgain: false })
      }
      onEmergencyStop={() => emergencyStopMutation.mutate()}
      onCloneRepo={(url) => cloneRepoMutation.mutate(url)}
      onCommand={handleCommand}
      onClearLogs={handleClearLogs}
    />
  );
}
