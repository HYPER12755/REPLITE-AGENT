import {
  Code,
  FileText,
  FolderTree,
  GitBranch,
  HardDrive,
  ListTodo,
  MessageSquare,
  Terminal,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type PanelType =
  | "editor"
  | "chat"
  | "terminal"
  | "files"
  | "tasks"
  | "tools"
  | "github"
  | "storage";

interface SideNavProps {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
  taskCount?: number;
  hasUnreadMessages?: boolean;
}

const navItems: { id: PanelType; icon: React.ElementType; label: string }[] = [
  { id: "editor", icon: Code, label: "Editor" },
  { id: "files", icon: FolderTree, label: "Files" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "tasks", icon: ListTodo, label: "Tasks" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
  { id: "tools", icon: Wrench, label: "Tools" },
  { id: "github", icon: GitBranch, label: "GitHub" },
  { id: "storage", icon: HardDrive, label: "Storage" },
];

export function SideNav({
  activePanel,
  onPanelChange,
  taskCount = 0,
  hasUnreadMessages = false,
}: SideNavProps) {
  return (
    <nav className="w-14 border-r border-border bg-sidebar flex flex-col items-center py-2 gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePanel === item.id;
        const showBadge =
          (item.id === "tasks" && taskCount > 0) ||
          (item.id === "chat" && hasUnreadMessages);

        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="icon"
                className={`relative h-10 w-10 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground"
                }`}
                onClick={() => onPanelChange(item.id)}
                data-testid={`button-nav-${item.id}`}
              >
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
