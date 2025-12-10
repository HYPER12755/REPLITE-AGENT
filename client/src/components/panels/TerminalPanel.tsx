import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Trash2, Copy, Check, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelHeader } from "./PanelHeader";
import type { LogEntry } from "@shared/schema";

interface TerminalPanelProps {
  logs: LogEntry[];
  onCommand?: (command: string) => void;
  onClear?: () => void;
}

export function TerminalPanel({ logs, onCommand, onClear }: TerminalPanelProps) {
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setCommandHistory((prev) => [...prev, input.trim()]);
    setHistoryIndex(-1);
    onCommand?.(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const copyLogs = async () => {
    const text = logs.map((l) => l.message).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "border-l-destructive text-destructive";
      case "warn":
        return "border-l-chart-4 text-chart-4";
      case "info":
        return "border-l-primary text-foreground";
      case "debug":
        return "border-l-muted text-muted-foreground";
      default:
        return "border-l-border text-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader
        title="Terminal"
        icon={<TerminalIcon className="h-4 w-4 text-muted-foreground" />}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setAutoScroll(!autoScroll)}
              data-testid="button-toggle-autoscroll"
            >
              <ArrowDown
                className={`h-4 w-4 ${autoScroll ? "text-primary" : "text-muted-foreground"}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyLogs}
              data-testid="button-copy-logs"
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
              onClick={onClear}
              data-testid="button-clear-terminal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <ScrollArea
        className="flex-1 font-mono text-xs"
        ref={scrollRef}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const isAtBottom =
            target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
          if (!isAtBottom) setAutoScroll(false);
        }}
      >
        <div className="p-2 space-y-0.5">
          {logs.length === 0 && (
            <div className="text-muted-foreground py-4 text-center">
              Terminal output will appear here...
            </div>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className={`py-0.5 px-2 border-l-2 ${getLevelColor(log.level)}`}
              data-testid={`log-entry-${log.id}`}
            >
              <span className="text-muted-foreground mr-2">
                {log.timestamp && new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="whitespace-pre-wrap break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-2 border-t border-border">
        <div className="flex items-center gap-2 bg-muted rounded-md px-3">
          <span className="text-muted-foreground font-mono text-xs">$</span>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="border-0 bg-transparent focus-visible:ring-0 font-mono text-xs h-8 px-0"
            data-testid="input-terminal-command"
          />
        </div>
      </form>
    </div>
  );
}
