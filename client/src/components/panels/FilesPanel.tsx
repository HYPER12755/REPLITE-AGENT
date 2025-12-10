import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelHeader } from "./PanelHeader";
import { cn } from "@/lib/utils";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  path: string;
}

interface FilesPanelProps {
  files: FileNode[];
  selectedFile?: string;
  onFileSelect: (path: string) => void;
  onRefresh?: () => void;
  onNewFile?: () => void;
  onUpload?: () => void;
}

function FileTreeItem({
  node,
  level,
  selectedFile,
  onFileSelect,
  expandedFolders,
  toggleFolder,
}: {
  node: FileNode;
  level: number;
  selectedFile?: string;
  onFileSelect: (path: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}) {
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedFile === node.path;
  const paddingLeft = level * 16 + 8;

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts":
      case "tsx":
        return "text-chart-1";
      case "js":
      case "jsx":
        return "text-chart-4";
      case "css":
      case "scss":
        return "text-chart-2";
      case "json":
        return "text-chart-5";
      case "md":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <>
      <button
        className={cn(
          "flex items-center gap-1.5 w-full h-7 px-2 rounded text-sm hover-elevate",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft }}
        onClick={() => {
          if (node.type === "folder") {
            toggleFolder(node.id);
          } else {
            onFileSelect(node.path);
          }
        }}
        data-testid={`file-tree-item-${node.id}`}
      >
        {node.type === "folder" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-chart-4" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-chart-4" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <File className={cn("h-4 w-4 shrink-0", getFileIcon(node.name))} />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function FilesPanel({
  files,
  selectedFile,
  onFileSelect,
  onRefresh,
  onNewFile,
  onUpload,
}: FilesPanelProps) {
  const [search, setSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    return nodes
      .map((node) => {
        if (node.type === "folder" && node.children) {
          const filtered = filterFiles(node.children, query);
          if (filtered.length > 0) {
            return { ...node, children: filtered };
          }
        }
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          return node;
        }
        return null;
      })
      .filter(Boolean) as FileNode[];
  };

  const filteredFiles = filterFiles(files, search);

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Files"
        icon={<FolderOpen className="h-4 w-4 text-muted-foreground" />}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onNewFile}
              data-testid="button-new-file"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onUpload}
              data-testid="button-upload-file"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRefresh}
              data-testid="button-refresh-files"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="h-8 pl-7 text-xs"
            data-testid="input-search-files"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {search ? "No matching files" : "No files in workspace"}
            </div>
          ) : (
            filteredFiles.map((node) => (
              <FileTreeItem
                key={node.id}
                node={node}
                level={0}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
