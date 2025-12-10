import { useState } from "react";
import { AlertTriangle, Check, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Approval } from "@shared/schema";

interface ApprovalModalProps {
  approval: Approval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (approvalId: string, dontAskAgain: boolean) => void;
  onReject: (approvalId: string) => void;
}

export function ApprovalModal({
  approval,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [understood, setUnderstood] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!approval) return null;

  const details = approval.details as Record<string, any> | null;
  const isDestructive = [
    "delete_file",
    "git_push",
    "shell_exec",
    "docker_run",
  ].includes(approval.action);

  const handleApprove = () => {
    onApprove(approval.id, dontAskAgain);
    setUnderstood(false);
    setDontAskAgain(false);
  };

  const handleReject = () => {
    onReject(approval.id);
    setUnderstood(false);
    setDontAskAgain(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isDestructive ? (
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-chart-4" />
              </div>
            )}
            <div>
              <DialogTitle>Action Requires Approval</DialogTitle>
              <DialogDescription>
                The agent wants to perform the following action
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={isDestructive ? "destructive" : "secondary"}
                className="uppercase text-[10px]"
              >
                {approval.action}
              </Badge>
            </div>

            {details && (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2 text-sm">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-muted-foreground font-medium min-w-[80px]">
                        {key}:
                      </span>
                      <span className="font-mono text-xs break-all">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {isDestructive && (
            <div className="p-3 rounded-lg border-l-4 border-l-destructive bg-destructive/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">
                    This is a potentially destructive operation
                  </p>
                  <p className="text-muted-foreground mt-1">
                    This action may modify files, push changes to a remote repository, or
                    execute system commands. Please review carefully before approving.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isDestructive && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked === true)}
                data-testid="checkbox-understood"
              />
              <label
                htmlFor="understood"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand the consequences of this action
              </label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dontAskAgain"
              checked={dontAskAgain}
              onCheckedChange={(checked) => setDontAskAgain(checked === true)}
              data-testid="checkbox-dont-ask"
            />
            <label
              htmlFor="dontAskAgain"
              className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don't ask again for this action type in this session
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReject} data-testid="button-reject-approval">
            <X className="h-4 w-4 mr-1.5" />
            Reject
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleApprove}
            disabled={isDestructive && !understood}
            data-testid="button-approve"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
