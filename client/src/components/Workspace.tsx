import { useState, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TopBar } from "./TopBar";
import { SideNav, type PanelType } from "./SideNav";
import { ChatPanel } from "./panels/ChatPanel";
import { TerminalPanel } from "./panels/TerminalPanel";
import { FilesPanel } from "./panels/FilesPanel";
import { TasksPanel } from "./panels/TasksPanel";
import { ToolsPanel } from "./panels/ToolsPanel";
import { GitHubPanel } from "./panels/GitHubPanel";
import { StoragePanel } from "./panels/StoragePanel";
import { EditorPanel } from "./panels/EditorPanel";
import { ApprovalModal } from "./ApprovalModal";
import { EmergencyStop } from "./EmergencyStop";
import type {
  Session,
  Message,
  Task,
  Tool,
  LogEntry,
  Artifact,
  Repository,
  Approval,
} from "@shared/schema";

interface OpenFile {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  isModified: boolean;
}

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  path: string;
}

interface WorkspaceProps {
  session: Session;
  messages: Message[];
  tasks: Task[];
  tools: Tool[];
  logs: LogEntry[];
  artifacts: Artifact[];
  repositories: Repository[];
  currentApproval: Approval | null;
  connectionStatus: "connected" | "disconnected" | "connecting";
  isMessageLoading: boolean;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  onDryRunToggle: (enabled: boolean) => void;
  onRunTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onRetryTask: (taskId: string) => void;
  onInstallTool: (toolId: string) => void;
  onApprove: (approvalId: string, dontAskAgain: boolean) => void;
  onReject: (approvalId: string) => void;
  onEmergencyStop: () => void;
  onCloneRepo: (url: string) => void;
  onCommand: (command: string) => void;
  onClearLogs: () => void;
}

export function Workspace({
  session,
  messages,
  tasks,
  tools,
  logs,
  artifacts,
  repositories,
  currentApproval,
  connectionStatus,
  isMessageLoading,
  onSendMessage,
  onStopGeneration,
  onDryRunToggle,
  onRunTask,
  onCancelTask,
  onRetryTask,
  onInstallTool,
  onApprove,
  onReject,
  onEmergencyStop,
  onCloneRepo,
  onCommand,
  onClearLogs,
}: WorkspaceProps) {
  const [activePanel, setActivePanel] = useState<PanelType>("chat");
  const [approvalOpen, setApprovalOpen] = useState(currentApproval !== null);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>();
  const [selectedFilePath, setSelectedFilePath] = useState<string>();

  const isRunning = session.status === "running";
  const runningTaskCount = tasks.filter((t) => t.status === "running").length;

  const sampleFiles: FileNode[] = [
    {
      id: "1",
      name: "src",
      type: "folder",
      path: "/src",
      children: [
        {
          id: "2",
          name: "components",
          type: "folder",
          path: "/src/components",
          children: [
            { id: "3", name: "App.tsx", type: "file", path: "/src/components/App.tsx" },
            { id: "4", name: "Button.tsx", type: "file", path: "/src/components/Button.tsx" },
          ],
        },
        { id: "5", name: "index.ts", type: "file", path: "/src/index.ts" },
      ],
    },
    { id: "6", name: "package.json", type: "file", path: "/package.json" },
    { id: "7", name: "README.md", type: "file", path: "/README.md" },
  ];

  const storageProviders = [
    { id: "local" as const, name: "Local", icon: null as any, connected: true },
    { id: "s3" as const, name: "S3", icon: null as any, connected: false },
    { id: "gcs" as const, name: "GCS", icon: null as any, connected: false },
    { id: "azure" as const, name: "Azure", icon: null as any, connected: false },
    { id: "dropbox" as const, name: "Dropbox", icon: null as any, connected: false },
    { id: "gdrive" as const, name: "G Drive", icon: null as any, connected: true },
  ];

  const handleFileSelect = useCallback((path: string) => {
    setSelectedFilePath(path);
    const existingFile = openFiles.find((f) => f.path === path);
    if (existingFile) {
      setActiveFileId(existingFile.id);
    } else {
      const name = path.split("/").pop() || path;
      const newFile: OpenFile = {
        id: `file-${Date.now()}`,
        path,
        name,
        content: `// Content of ${name}\n\nexport function example() {\n  return 'Hello, World!';\n}\n`,
        originalContent: "",
        language: path.endsWith(".ts") || path.endsWith(".tsx") ? "typescript" : "javascript",
        isModified: false,
      };
      newFile.originalContent = newFile.content;
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
    }
    setActivePanel("editor");
  }, [openFiles]);

  const handleFileClose = useCallback((fileId: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (activeFileId === fileId) {
      const remaining = openFiles.filter((f) => f.id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : undefined);
    }
  }, [activeFileId, openFiles]);

  const handleFileSave = useCallback((fileId: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, originalContent: content, isModified: false } : f
      )
    );
  }, []);

  const handleContentChange = useCallback((fileId: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, content, isModified: content !== f.originalContent }
          : f
      )
    );
  }, []);

  const renderPanel = () => {
    switch (activePanel) {
      case "editor":
        return (
          <EditorPanel
            openFiles={openFiles}
            activeFileId={activeFileId}
            onFileSelect={setActiveFileId}
            onFileClose={handleFileClose}
            onFileSave={handleFileSave}
            onContentChange={handleContentChange}
          />
        );
      case "chat":
        return (
          <ChatPanel
            messages={messages}
            isLoading={isMessageLoading}
            onSendMessage={onSendMessage}
            onStopGeneration={onStopGeneration}
          />
        );
      case "terminal":
        return (
          <TerminalPanel
            logs={logs}
            onCommand={onCommand}
            onClear={onClearLogs}
          />
        );
      case "files":
        return (
          <FilesPanel
            files={sampleFiles}
            selectedFile={selectedFilePath}
            onFileSelect={handleFileSelect}
          />
        );
      case "tasks":
        return (
          <TasksPanel
            tasks={tasks}
            onRunTask={onRunTask}
            onCancelTask={onCancelTask}
            onRetryTask={onRetryTask}
          />
        );
      case "tools":
        return (
          <ToolsPanel
            tools={tools}
            onInstallTool={onInstallTool}
          />
        );
      case "github":
        return (
          <GitHubPanel
            repositories={repositories}
            currentRepo={repositories[0]}
            branches={["main", "develop", "feature/ai-agent"]}
            onCloneRepo={onCloneRepo}
          />
        );
      case "storage":
        return (
          <StoragePanel
            artifacts={artifacts}
            providers={storageProviders}
            activeProvider="local"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        sessionName={session.name}
        sessionStatus={session.status as any}
        dryRunMode={session.dryRunMode}
        onDryRunToggle={onDryRunToggle}
        connectionStatus={connectionStatus}
      />

      <div className="flex-1 flex overflow-hidden">
        <SideNav
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          taskCount={runningTaskCount}
          hasUnreadMessages={false}
        />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={65} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} minSize={30}>
                {activePanel === "editor" || activePanel === "files" ? (
                  <EditorPanel
                    openFiles={openFiles}
                    activeFileId={activeFileId}
                    onFileSelect={setActiveFileId}
                    onFileClose={handleFileClose}
                    onFileSave={handleFileSave}
                    onContentChange={handleContentChange}
                  />
                ) : (
                  renderPanel()
                )}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={15}>
                <TerminalPanel
                  logs={logs}
                  onCommand={onCommand}
                  onClear={onClearLogs}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={30}>
                <ChatPanel
                  messages={messages}
                  isLoading={isMessageLoading}
                  onSendMessage={onSendMessage}
                  onStopGeneration={onStopGeneration}
                />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={20}>
                <TasksPanel
                  tasks={tasks}
                  onRunTask={onRunTask}
                  onCancelTask={onCancelTask}
                  onRetryTask={onRetryTask}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ApprovalModal
        approval={currentApproval}
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        onApprove={onApprove}
        onReject={onReject}
      />

      <EmergencyStop isRunning={isRunning} onStop={onEmergencyStop} />
    </div>
  );
}
