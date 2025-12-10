import { useState } from "react";
import {
  Cloud,
  Download,
  ExternalLink,
  FileArchive,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PanelHeader } from "./PanelHeader";
import type { Artifact } from "@shared/schema";

type StorageProvider = "local" | "s3" | "gcs" | "azure" | "dropbox" | "gdrive" | "ipfs";

interface StorageProviderConfig {
  id: StorageProvider;
  name: string;
  icon: React.ElementType;
  connected: boolean;
}

interface StoragePanelProps {
  artifacts: Artifact[];
  providers: StorageProviderConfig[];
  activeProvider: StorageProvider;
  onProviderChange?: (provider: StorageProvider) => void;
  onConnectProvider?: (provider: StorageProvider) => void;
  onUploadArtifact?: () => void;
  onDownloadArtifact?: (artifactId: string) => void;
  onDeleteArtifact?: (artifactId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function ProviderIcon({ provider }: { provider: StorageProvider }) {
  const icons: Record<StorageProvider, React.ElementType> = {
    local: HardDrive,
    s3: Cloud,
    gcs: Cloud,
    azure: Cloud,
    dropbox: Cloud,
    gdrive: Cloud,
    ipfs: Cloud,
  };
  const Icon = icons[provider];
  return <Icon className="h-4 w-4" />;
}

export function StoragePanel({
  artifacts,
  providers,
  activeProvider,
  onProviderChange,
  onConnectProvider,
  onUploadArtifact,
  onDownloadArtifact,
  onDeleteArtifact,
  onRefresh,
  isLoading,
}: StoragePanelProps) {
  const [search, setSearch] = useState("");

  const filteredArtifacts = artifacts.filter(
    (artifact) =>
      artifact.name.toLowerCase().includes(search.toLowerCase()) ||
      artifact.path.toLowerCase().includes(search.toLowerCase())
  );

  const activeProviderConfig = providers.find((p) => p.id === activeProvider);

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Storage"
        icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onUploadArtifact}
              data-testid="button-upload-artifact"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRefresh}
              disabled={isLoading}
              data-testid="button-refresh-storage"
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

      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts..."
            className="h-8 pl-7 text-xs"
            data-testid="input-search-artifacts"
          />
        </div>
      </div>

      <div className="p-2 border-b border-border">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Providers
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant={activeProvider === provider.id ? "secondary" : "ghost"}
              size="sm"
              className="h-auto py-2 px-2 flex flex-col items-center gap-1"
              onClick={() =>
                provider.connected
                  ? onProviderChange?.(provider.id)
                  : onConnectProvider?.(provider.id)
              }
              data-testid={`button-provider-${provider.id}`}
            >
              <ProviderIcon provider={provider.id} />
              <span className="text-[10px]">{provider.name}</span>
              {!provider.connected && (
                <Badge variant="outline" className="text-[8px] px-1 py-0">
                  Connect
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredArtifacts.length === 0 ? (
          <div className="text-center py-12">
            <FileArchive className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search ? "No matching artifacts" : "No artifacts stored"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Run tasks to generate artifacts
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs w-20">Size</TableHead>
                <TableHead className="text-xs w-24">Date</TableHead>
                <TableHead className="text-xs w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtifacts.map((artifact) => (
                <TableRow key={artifact.id} data-testid={`artifact-row-${artifact.id}`}>
                  <TableCell className="text-xs py-2">
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate max-w-[150px]">{artifact.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground">
                    {formatFileSize(artifact.size)}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground">
                    {artifact.createdAt &&
                      new Date(artifact.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDownloadArtifact?.(artifact.id)}
                        data-testid={`button-download-artifact-${artifact.id}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => onDeleteArtifact?.(artifact.id)}
                        data-testid={`button-delete-artifact-${artifact.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
