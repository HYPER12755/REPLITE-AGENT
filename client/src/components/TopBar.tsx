import { Activity, ChevronDown, LogOut, Settings, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TopBarProps {
  sessionName: string;
  sessionStatus: "idle" | "running" | "paused" | "completed" | "failed";
  dryRunMode: boolean;
  onDryRunToggle: (enabled: boolean) => void;
  connectionStatus: "connected" | "disconnected" | "connecting";
}

export function TopBar({
  sessionName,
  sessionStatus,
  dryRunMode,
  onDryRunToggle,
  connectionStatus,
}: TopBarProps) {
  const statusColors = {
    idle: "bg-muted-foreground",
    running: "bg-chart-3 animate-pulse",
    paused: "bg-chart-4",
    completed: "bg-chart-3",
    failed: "bg-destructive",
  };

  const connectionColors = {
    connected: "bg-chart-3",
    disconnected: "bg-destructive",
    connecting: "bg-chart-4 animate-pulse",
  };

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-3 gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm" data-testid="text-app-name">
            REPLITE
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Session:</span>
          <span className="text-sm font-medium" data-testid="text-session-name">
            {sessionName}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`h-2 w-2 rounded-full ${statusColors[sessionStatus]}`}
                data-testid="status-session"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">{sessionStatus}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {dryRunMode && (
          <Badge variant="outline" className="text-chart-4 border-chart-4">
            Dry-run mode
          </Badge>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Dry-run</span>
          <Switch
            checked={dryRunMode}
            onCheckedChange={onDryRunToggle}
            data-testid="switch-dry-run"
          />
        </div>

        <div className="h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${connectionColors[connectionStatus]}`}
                data-testid="status-connection"
              />
              <span className="text-xs text-muted-foreground capitalize">
                {connectionStatus}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>WebSocket {connectionStatus}</p>
          </TooltipContent>
        </Tooltip>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1" data-testid="button-user-menu">
              <User className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid="menuitem-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menuitem-activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menuitem-logout" className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
