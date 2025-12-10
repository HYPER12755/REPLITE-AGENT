import { useState, useCallback } from "react";
import {
  Check,
  ChevronDown,
  Code,
  Copy,
  FileText,
  Loader2,
  MoreVertical,
  Save,
  X,
  Undo2,
  Redo2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PanelHeader } from "./PanelHeader";
import { cn } from "@/lib/utils";

interface OpenFile {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  isModified: boolean;
}

interface EditorPanelProps {
  openFiles: OpenFile[];
  activeFileId?: string;
  onFileSelect: (fileId: string) => void;
  onFileClose: (fileId: string) => void;
  onFileSave: (fileId: string, content: string) => void;
  onContentChange: (fileId: string, content: string) => void;
  isSaving?: boolean;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    yaml: "yaml",
    yml: "yaml",
    sql: "sql",
    sh: "shell",
    bash: "shell",
  };
  return langMap[ext || ""] || "plaintext";
}

function LineNumbers({ lineCount }: { lineCount: number }) {
  return (
    <div className="select-none text-right pr-3 text-muted-foreground font-mono text-xs leading-5">
      {Array.from({ length: lineCount }, (_, i) => (
        <div key={i + 1}>{i + 1}</div>
      ))}
    </div>
  );
}

export function EditorPanel({
  openFiles,
  activeFileId,
  onFileSelect,
  onFileClose,
  onFileSave,
  onContentChange,
  isSaving,
}: EditorPanelProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const activeFile = openFiles.find((f) => f.id === activeFileId);
  const lineCount = activeFile ? activeFile.content.split("\n").length : 0;

  const handleSave = useCallback(() => {
    if (activeFile) {
      onFileSave(activeFile.id, activeFile.content);
    }
  }, [activeFile, onFileSave]);

  const handleCopy = async () => {
    if (activeFile) {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "f") {
      e.preventDefault();
      setShowSearch(!showSearch);
    }
  };

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      <PanelHeader
        title="Editor"
        icon={<Code className="h-4 w-4 text-muted-foreground" />}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowSearch(!showSearch)}
              data-testid="button-toggle-search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
              data-testid="button-copy-code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-chart-3" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSave}
              disabled={!activeFile?.isModified || isSaving}
              data-testid="button-save-file"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </>
        }
      />

      {openFiles.length > 0 && (
        <div className="flex items-center border-b border-border bg-muted/30 overflow-x-auto">
          {openFiles.map((file) => (
            <button
              key={file.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs border-r border-border hover-elevate min-w-0",
                activeFileId === file.id && "bg-background"
              )}
              onClick={() => onFileSelect(file.id)}
              data-testid={`tab-file-${file.id}`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate max-w-[100px]">{file.name}</span>
              {file.isModified && (
                <span className="h-1.5 w-1.5 rounded-full bg-chart-4 shrink-0" />
              )}
              <button
                className="ml-1 p-0.5 rounded hover:bg-muted shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClose(file.id);
                }}
                data-testid={`button-close-file-${file.id}`}
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      )}

      {showSearch && (
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in file..."
              className="h-8 pl-7 text-xs"
              autoFocus
              data-testid="input-search-in-file"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <div className="flex h-full">
            <div className="w-12 py-2 bg-muted/30 border-r border-border shrink-0 overflow-hidden">
              <LineNumbers lineCount={lineCount} />
            </div>
            <ScrollArea className="flex-1">
              <textarea
                value={activeFile.content}
                onChange={(e) => onContentChange(activeFile.id, e.target.value)}
                className="w-full h-full min-h-[400px] p-2 font-mono text-xs leading-5 bg-transparent resize-none focus:outline-none"
                spellCheck={false}
                data-testid="textarea-editor"
              />
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No file open</p>
              <p className="text-xs mt-1">Select a file from the file tree</p>
            </div>
          </div>
        )}
      </div>

      {activeFile && (
        <div className="h-6 px-3 border-t border-border bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{activeFile.path}</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {activeFile.language}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span>Lines: {lineCount}</span>
            <span>Chars: {activeFile.content.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
