import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  ListTodo,
  Loader2,
  Play,
  RefreshCw,
  Square,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { PanelHeader } from "./PanelHeader";
import type { Task, ActionStep } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TasksPanelProps {
  tasks: Task[];
  onRunTask?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
  onRetryTask?: (taskId: string) => void;
}

function TaskStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-chart-3" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "cancelled":
      return <Square className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function ActionStepItem({
  step,
  index,
  isCurrentStep,
}: {
  step: ActionStep;
  index: number;
  isCurrentStep: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 py-1.5 pl-6 pr-2 text-xs",
        isCurrentStep && "bg-accent/50"
      )}
    >
      <span className="text-muted-foreground w-4 text-right shrink-0">
        {index + 1}.
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {step.action}
          </Badge>
          {step.target && (
            <span className="text-muted-foreground truncate">{step.target}</span>
          )}
        </div>
        {step.description && (
          <p className="text-muted-foreground mt-0.5 truncate">
            {step.description}
          </p>
        )}
      </div>
      {isCurrentStep && <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />}
    </div>
  );
}

function TaskItem({
  task,
  onRun,
  onCancel,
  onRetry,
}: {
  task: Task;
  onRun?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}) {
  const [expanded, setExpanded] = useState(task.status === "running");
  const plan = (task.plan as ActionStep[] | null) || [];
  const progress =
    task.totalSteps && task.totalSteps > 0
      ? ((task.currentStep || 0) / task.totalSteps) * 100
      : 0;

  return (
    <div className="border-b border-border" data-testid={`task-item-${task.id}`}>
      <button
        className="w-full flex items-start gap-3 py-3 px-4 text-left hover-elevate"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        )}

        <TaskStatusIcon status={task.status} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{task.title}</span>
            {task.retryCount && task.retryCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                Retry {task.retryCount}
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {task.description}
            </p>
          )}

          {task.status === "running" && task.totalSteps && task.totalSteps > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Step {task.currentStep} of {task.totalSteps}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          )}

          {task.error && (
            <p className="text-xs text-destructive mt-1 truncate">{task.error}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {task.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onRun?.();
              }}
              data-testid={`button-run-task-${task.id}`}
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
          {task.status === "running" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onCancel?.();
              }}
              data-testid={`button-cancel-task-${task.id}`}
            >
              <Square className="h-3 w-3" />
            </Button>
          )}
          {task.status === "failed" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onRetry?.();
              }}
              data-testid={`button-retry-task-${task.id}`}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </button>

      {expanded && plan.length > 0 && (
        <div className="pb-2 border-t border-border bg-muted/30">
          {plan.map((step, index) => (
            <ActionStepItem
              key={index}
              step={step}
              index={index}
              isCurrentStep={
                task.status === "running" && index === (task.currentStep || 0)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TasksPanel({
  tasks,
  onRunTask,
  onCancelTask,
  onRetryTask,
}: TasksPanelProps) {
  const runningTasks = tasks.filter((t) => t.status === "running");
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "failed" || t.status === "cancelled"
  );

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Tasks"
        icon={<ListTodo className="h-4 w-4 text-muted-foreground" />}
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{pendingTasks.length} pending</span>
          </div>
        }
      />

      <ScrollArea className="flex-1">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <ListTodo className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Chat with the agent to create tasks
            </p>
          </div>
        ) : (
          <>
            {runningTasks.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/50">
                  Running ({runningTasks.length})
                </div>
                {runningTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onRun={() => onRunTask?.(task.id)}
                    onCancel={() => onCancelTask?.(task.id)}
                    onRetry={() => onRetryTask?.(task.id)}
                  />
                ))}
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/50">
                  Pending ({pendingTasks.length})
                </div>
                {pendingTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onRun={() => onRunTask?.(task.id)}
                    onCancel={() => onCancelTask?.(task.id)}
                    onRetry={() => onRetryTask?.(task.id)}
                  />
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/50">
                  History ({completedTasks.length})
                </div>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onRun={() => onRunTask?.(task.id)}
                    onCancel={() => onCancelTask?.(task.id)}
                    onRetry={() => onRetryTask?.(task.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}
