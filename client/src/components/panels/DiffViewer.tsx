import { useState } from "react";
import { Check, ChevronDown, ChevronRight, X, FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  lineNumber?: number;
}

interface DiffHunk {
  id: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface FileDiff {
  id: string;
  path: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

interface DiffViewerProps {
  diffs: FileDiff[];
  onAcceptHunk?: (fileId: string, hunkId: string) => void;
  onRejectHunk?: (fileId: string, hunkId: string) => void;
  onAcceptFile?: (fileId: string) => void;
  onRejectFile?: (fileId: string) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

function DiffLineView({ line }: { line: DiffLine }) {
  return (
    <div
      className={cn(
        "flex items-stretch font-mono text-xs leading-5",
        line.type === "add" && "bg-chart-3/10",
        line.type === "remove" && "bg-destructive/10"
      )}
    >
      <div className="w-8 text-right pr-2 text-muted-foreground shrink-0 select-none">
        {line.lineNumber}
      </div>
      <div
        className={cn(
          "w-6 text-center shrink-0 select-none",
          line.type === "add" && "text-chart-3",
          line.type === "remove" && "text-destructive"
        )}
      >
        {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
      </div>
      <pre className="flex-1 px-2 whitespace-pre-wrap break-all">{line.content}</pre>
    </div>
  );
}

function HunkView({
  hunk,
  fileId,
  onAccept,
  onReject,
}: {
  hunk: DiffHunk;
  fileId: string;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <div className="border border-border rounded-md overflow-hidden mb-2">
      <div className="flex items-center justify-between px-2 py-1 bg-muted/50 text-xs">
        <span className="text-muted-foreground font-mono">
          @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-chart-3"
            onClick={onAccept}
            data-testid={`button-accept-hunk-${hunk.id}`}
          >
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-destructive"
            onClick={onReject}
            data-testid={`button-reject-hunk-${hunk.id}`}
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      </div>
      <div>
        {hunk.lines.map((line, index) => (
          <DiffLineView key={index} line={line} />
        ))}
      </div>
    </div>
  );
}

function FileDiffView({
  diff,
  onAcceptHunk,
  onRejectHunk,
  onAcceptFile,
  onRejectFile,
}: {
  diff: FileDiff;
  onAcceptHunk?: (hunkId: string) => void;
  onRejectHunk?: (hunkId: string) => void;
  onAcceptFile?: () => void;
  onRejectFile?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="w-full flex items-center gap-2 px-4 py-2 hover-elevate text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium flex-1 truncate">{diff.path}</span>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] text-chart-3">
            +{diff.additions}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-destructive">
            -{diff.deletions}
          </Badge>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-end gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onAcceptFile}
              data-testid={`button-accept-file-${diff.id}`}
            >
              <Check className="h-3 w-3 mr-1 text-chart-3" />
              Accept All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onRejectFile}
              data-testid={`button-reject-file-${diff.id}`}
            >
              <X className="h-3 w-3 mr-1 text-destructive" />
              Reject All
            </Button>
          </div>
          {diff.hunks.map((hunk) => (
            <HunkView
              key={hunk.id}
              hunk={hunk}
              fileId={diff.id}
              onAccept={() => onAcceptHunk?.(hunk.id)}
              onReject={() => onRejectHunk?.(hunk.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DiffViewer({
  diffs,
  onAcceptHunk,
  onRejectHunk,
  onAcceptFile,
  onRejectFile,
  onAcceptAll,
  onRejectAll,
}: DiffViewerProps) {
  const totalAdditions = diffs.reduce((sum, d) => sum + d.additions, 0);
  const totalDeletions = diffs.reduce((sum, d) => sum + d.deletions, 0);

  if (diffs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No changes to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{diffs.length} files changed</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-chart-3">
              +{totalAdditions}
            </Badge>
            <Badge variant="outline" className="text-destructive">
              -{totalDeletions}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-8"
            onClick={onAcceptAll}
            data-testid="button-accept-all"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Accept All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={onRejectAll}
            data-testid="button-reject-all"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reject All
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {diffs.map((diff) => (
          <FileDiffView
            key={diff.id}
            diff={diff}
            onAcceptHunk={(hunkId) => onAcceptHunk?.(diff.id, hunkId)}
            onRejectHunk={(hunkId) => onRejectHunk?.(diff.id, hunkId)}
            onAcceptFile={() => onAcceptFile?.(diff.id)}
            onRejectFile={() => onRejectFile?.(diff.id)}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
