import { useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Settings2,
  Wrench,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { PanelHeader } from "./PanelHeader";
import type { Tool } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ToolsPanelProps {
  tools: Tool[];
  onInstallTool?: (toolId: string) => void;
  onConfigureTool?: (toolId: string) => void;
  onAddTool?: () => void;
  installingToolId?: string;
}

function ToolTypeIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    shell: "bg-chart-3/20 text-chart-3",
    python: "bg-chart-1/20 text-chart-1",
    api: "bg-chart-2/20 text-chart-2",
    docker: "bg-chart-5/20 text-chart-5",
    "container-run": "bg-chart-4/20 text-chart-4",
  };

  return (
    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center text-xs font-medium", colors[type] || "bg-muted text-muted-foreground")}>
      {type.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function ToolsPanel({
  tools,
  onInstallTool,
  onConfigureTool,
  onAddTool,
  installingToolId,
}: ToolsPanelProps) {
  const [search, setSearch] = useState("");

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description?.toLowerCase().includes(search.toLowerCase())
  );

  const installedTools = filteredTools.filter((t) => t.isInstalled);
  const availableTools = filteredTools.filter((t) => !t.isInstalled);

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Tools"
        icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onAddTool}
            data-testid="button-add-tool"
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="h-8 pl-7 text-xs"
            data-testid="input-search-tools"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search ? "No matching tools" : "No tools registered"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {installedTools.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Installed ({installedTools.length})
                </h3>
                <div className="space-y-2">
                  {installedTools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="p-3"
                      data-testid={`tool-card-${tool.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <ToolTypeIcon type={tool.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{tool.name}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />
                            {tool.version && (
                              <Badge variant="outline" className="text-[10px]">
                                v{tool.version}
                              </Badge>
                            )}
                          </div>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {tool.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onConfigureTool?.(tool.id)}
                          data-testid={`button-configure-tool-${tool.id}`}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {availableTools.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Available ({availableTools.length})
                </h3>
                <div className="space-y-2">
                  {availableTools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="p-3"
                      data-testid={`tool-card-${tool.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <ToolTypeIcon type={tool.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{tool.name}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {tool.type}
                            </Badge>
                          </div>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {tool.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 h-7 px-2"
                          onClick={() => onInstallTool?.(tool.id)}
                          disabled={installingToolId === tool.id}
                          data-testid={`button-install-tool-${tool.id}`}
                        >
                          {installingToolId === tool.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Installing
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Install
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
