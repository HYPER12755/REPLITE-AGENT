import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, icon, actions, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "h-10 px-4 py-2 border-b border-border flex items-center justify-between gap-2 bg-card/50 sticky top-0 z-10",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}
