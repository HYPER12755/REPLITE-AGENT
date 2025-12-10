import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PanelHeader } from "./PanelHeader";
import type { Repository } from "@shared/schema";

interface GitHubPanelProps {
  repositories: Repository[];
  currentRepo?: Repository;
  branches?: string[];
  onCloneRepo?: (url: string) => void;
  onSwitchBranch?: (branch: string) => void;
  onCreateBranch?: (name: string) => void;
  onCommit?: () => void;
  onPush?: () => void;
  onCreatePR?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function GitHubPanel({
  repositories,
  currentRepo,
  branches = [],
  onCloneRepo,
  onSwitchBranch,
  onCreateBranch,
  onCommit,
  onPush,
  onCreatePR,
  onRefresh,
  isLoading,
}: GitHubPanelProps) {
  const [cloneUrl, setCloneUrl] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClone = () => {
    if (cloneUrl.trim()) {
      onCloneRepo?.(cloneUrl.trim());
      setCloneUrl("");
      setShowCloneForm(false);
    }
  };

  const handleCreateBranch = () => {
    if (newBranch.trim()) {
      onCreateBranch?.(newBranch.trim());
      setNewBranch("");
      setShowBranchForm(false);
    }
  };

  const copyCloneUrl = async () => {
    if (currentRepo?.cloneUrl) {
      await navigator.clipboard.writeText(currentRepo.cloneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="GitHub"
        icon={<FolderGit2 className="h-4 w-4 text-muted-foreground" />}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowCloneForm(!showCloneForm)}
              data-testid="button-clone-repo"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRefresh}
              disabled={isLoading}
              data-testid="button-refresh-github"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </>
        }
      />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {showCloneForm && (
            <Card className="p-3">
              <h4 className="text-xs font-medium mb-2">Clone Repository</h4>
              <div className="flex gap-2">
                <Input
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="h-8 text-xs"
                  data-testid="input-clone-url"
                />
                <Button
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={handleClone}
                  data-testid="button-do-clone"
                >
                  Clone
                </Button>
              </div>
            </Card>
          )}

          {currentRepo ? (
            <>
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{currentRepo.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyCloneUrl}
                      data-testid="button-copy-clone-url"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-chart-3" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        window.open(
                          `https://github.com/${currentRepo.fullName}`,
                          "_blank"
                        )
                      }
                      data-testid="button-open-github"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Branch
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowBranchForm(!showBranchForm)}
                    data-testid="button-new-branch"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>

                {showBranchForm && (
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      placeholder="branch-name"
                      className="h-7 text-xs"
                      data-testid="input-new-branch"
                    />
                    <Button
                      size="sm"
                      className="h-7 shrink-0"
                      onClick={handleCreateBranch}
                      data-testid="button-create-branch"
                    >
                      Create
                    </Button>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-8"
                      data-testid="dropdown-branch"
                    >
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {currentRepo.currentBranch || currentRepo.defaultBranch}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {branches.map((branch) => (
                      <DropdownMenuItem
                        key={branch}
                        onClick={() => onSwitchBranch?.(branch)}
                        data-testid={`menuitem-branch-${branch}`}
                      >
                        <GitBranch className="h-3.5 w-3.5 mr-2" />
                        {branch}
                        {branch ===
                          (currentRepo.currentBranch || currentRepo.defaultBranch) && (
                          <Check className="h-3.5 w-3.5 ml-auto" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={onCommit}
                    data-testid="button-commit"
                  >
                    <GitCommit className="h-3.5 w-3.5 mr-1.5" />
                    Commit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={onPush}
                    data-testid="button-push"
                  >
                    <GitMerge className="h-3.5 w-3.5 mr-1.5" />
                    Push
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 col-span-2"
                    onClick={onCreatePR}
                    data-testid="button-create-pr"
                  >
                    <GitPullRequest className="h-3.5 w-3.5 mr-1.5" />
                    Create Pull Request
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FolderGit2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No repository connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clone a repository to get started
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowCloneForm(true)}
                data-testid="button-clone-repo-empty"
              >
                <Plus className="h-4 w-4 mr-1" />
                Clone Repository
              </Button>
            </div>
          )}

          {repositories.length > 1 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Other Repositories
              </h4>
              <div className="space-y-2">
                {repositories
                  .filter((r) => r.id !== currentRepo?.id)
                  .map((repo) => (
                    <Card
                      key={repo.id}
                      className="p-2 hover-elevate cursor-pointer"
                      data-testid={`repo-card-${repo.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{repo.fullName}</span>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
