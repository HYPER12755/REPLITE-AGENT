// Storage provider abstraction layer for artifact management
import * as fs from "fs/promises";
import * as path from "path";

export interface ArtifactRef {
  provider: string;
  ref: string;
  metadata?: Record<string, any>;
}

export interface StorageProvider {
  name: string;
  
  saveArtifact(
    sessionId: string,
    pathOrBuffer: string | Buffer,
    metadata?: Record<string, any>
  ): Promise<ArtifactRef>;
  
  getArtifact(ref: ArtifactRef): Promise<Buffer | NodeJS.ReadableStream>;
  
  listArtifacts(sessionId: string, prefix?: string): Promise<ArtifactRef[]>;
  
  deleteArtifact(ref: ArtifactRef): Promise<void>;
  
  getPresignedUrl?(ref: ArtifactRef, expiresIn?: number): Promise<string>;
}

// Local filesystem storage provider
export class LocalStorageProvider implements StorageProvider {
  name = "local";
  private basePath: string;

  constructor(basePath = "./artifacts") {
    this.basePath = basePath;
  }

  private getSessionPath(sessionId: string): string {
    return path.join(this.basePath, sessionId);
  }

  async saveArtifact(
    sessionId: string,
    pathOrBuffer: string | Buffer,
    metadata?: Record<string, any>
  ): Promise<ArtifactRef> {
    const sessionPath = this.getSessionPath(sessionId);
    await fs.mkdir(sessionPath, { recursive: true });

    let content: Buffer;
    let fileName: string;

    if (typeof pathOrBuffer === "string") {
      // It's a file path, read the content
      content = await fs.readFile(pathOrBuffer);
      fileName = path.basename(pathOrBuffer);
    } else {
      // It's a buffer
      content = pathOrBuffer;
      fileName = metadata?.name || `artifact-${Date.now()}`;
    }

    const artifactPath = path.join(sessionPath, fileName);
    await fs.writeFile(artifactPath, content);

    // Save metadata
    const metadataPath = `${artifactPath}.meta.json`;
    await fs.writeFile(
      metadataPath,
      JSON.stringify({
        ...metadata,
        size: content.length,
        createdAt: new Date().toISOString(),
      })
    );

    return {
      provider: this.name,
      ref: path.relative(this.basePath, artifactPath),
      metadata,
    };
  }

  async getArtifact(ref: ArtifactRef): Promise<Buffer> {
    const artifactPath = path.join(this.basePath, ref.ref);
    return fs.readFile(artifactPath);
  }

  async listArtifacts(sessionId: string, prefix?: string): Promise<ArtifactRef[]> {
    const sessionPath = this.getSessionPath(sessionId);
    
    try {
      const files = await fs.readdir(sessionPath);
      const artifacts: ArtifactRef[] = [];

      for (const file of files) {
        if (file.endsWith(".meta.json")) continue;
        if (prefix && !file.startsWith(prefix)) continue;

        const filePath = path.join(sessionPath, file);
        const metadataPath = `${filePath}.meta.json`;
        
        let metadata: Record<string, any> = {};
        try {
          const metaContent = await fs.readFile(metadataPath, "utf-8");
          metadata = JSON.parse(metaContent);
        } catch {
          // No metadata file
        }

        artifacts.push({
          provider: this.name,
          ref: path.relative(this.basePath, filePath),
          metadata,
        });
      }

      return artifacts;
    } catch {
      return [];
    }
  }

  async deleteArtifact(ref: ArtifactRef): Promise<void> {
    const artifactPath = path.join(this.basePath, ref.ref);
    const metadataPath = `${artifactPath}.meta.json`;

    await fs.unlink(artifactPath).catch(() => {});
    await fs.unlink(metadataPath).catch(() => {});
  }
}

// S3 storage provider stub (requires AWS SDK)
export class S3StorageProvider implements StorageProvider {
  name = "s3";
  private bucket: string;
  private region: string;

  constructor(bucket: string, region = "us-east-1") {
    this.bucket = bucket;
    this.region = region;
  }

  async saveArtifact(
    sessionId: string,
    pathOrBuffer: string | Buffer,
    metadata?: Record<string, any>
  ): Promise<ArtifactRef> {
    // TODO: Implement S3 upload using AWS SDK
    // const s3Client = new S3Client({ region: this.region });
    // await s3Client.send(new PutObjectCommand({ ... }));
    
    throw new Error("S3 storage provider not yet implemented. Please configure AWS credentials.");
  }

  async getArtifact(ref: ArtifactRef): Promise<Buffer> {
    throw new Error("S3 storage provider not yet implemented");
  }

  async listArtifacts(sessionId: string, prefix?: string): Promise<ArtifactRef[]> {
    throw new Error("S3 storage provider not yet implemented");
  }

  async deleteArtifact(ref: ArtifactRef): Promise<void> {
    throw new Error("S3 storage provider not yet implemented");
  }

  async getPresignedUrl(ref: ArtifactRef, expiresIn = 3600): Promise<string> {
    throw new Error("S3 storage provider not yet implemented");
  }
}

// Storage manager that handles multiple providers
export class StorageManager {
  private providers: Map<string, StorageProvider> = new Map();
  private defaultProvider: string = "local";

  constructor() {
    // Register default local provider
    this.registerProvider(new LocalStorageProvider());
  }

  registerProvider(provider: StorageProvider): void {
    this.providers.set(provider.name, provider);
  }

  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not registered`);
    }
    this.defaultProvider = name;
  }

  getProvider(name?: string): StorageProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async saveArtifact(
    sessionId: string,
    pathOrBuffer: string | Buffer,
    metadata?: Record<string, any>,
    providerName?: string
  ): Promise<ArtifactRef> {
    const provider = this.getProvider(providerName);
    return provider.saveArtifact(sessionId, pathOrBuffer, metadata);
  }

  async getArtifact(ref: ArtifactRef): Promise<Buffer | NodeJS.ReadableStream> {
    const provider = this.getProvider(ref.provider);
    return provider.getArtifact(ref);
  }

  async listArtifacts(
    sessionId: string,
    prefix?: string,
    providerName?: string
  ): Promise<ArtifactRef[]> {
    const provider = this.getProvider(providerName);
    return provider.listArtifacts(sessionId, prefix);
  }

  async deleteArtifact(ref: ArtifactRef): Promise<void> {
    const provider = this.getProvider(ref.provider);
    return provider.deleteArtifact(ref);
  }

  async getPresignedUrl(ref: ArtifactRef, expiresIn?: number): Promise<string | null> {
    const provider = this.getProvider(ref.provider);
    if (provider.getPresignedUrl) {
      return provider.getPresignedUrl(ref, expiresIn);
    }
    return null;
  }
}

export const storageManager = new StorageManager();
