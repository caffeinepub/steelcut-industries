import { StorageClient } from "./StorageClient";
import { loadConfig } from "../config";
import { HttpAgent } from "@icp-sdk/core/agent";

let storageClient: StorageClient | null = null;

export async function getStorageClient(): Promise<StorageClient> {
  if (!storageClient) {
    const config = await loadConfig();
    const agent = new HttpAgent({
      host: config.backend_host,
    });
    
    if (config.backend_host?.includes("localhost")) {
      await agent.fetchRootKey().catch((err) => {
        console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
        console.error(err);
      });
    }
    
    storageClient = new StorageClient(
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent
    );
  }
  return storageClient;
}

export class ExternalBlob {
  private hash: string | null = null;
  private bytes: Uint8Array | null = null;
  private progressCallback?: (percentage: number) => void;

  private constructor() {}

  static fromURL(url: string): ExternalBlob {
    const blob = new ExternalBlob();
    const hashMatch = url.match(/blob_hash=([^&]+)/);
    if (hashMatch) {
      blob.hash = decodeURIComponent(hashMatch[1]);
    }
    return blob;
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const blob = new ExternalBlob();
    blob.bytes = bytes;
    return blob;
  }

  withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    this.progressCallback = onProgress;
    return this;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this.bytes) {
      return this.bytes;
    }
    if (this.hash) {
      const url = await this.getDirectURL();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
    throw new Error("No bytes or hash available");
  }

  async getDirectURL(): Promise<string> {
    if (!this.hash) {
      throw new Error("Cannot get URL: blob not uploaded yet");
    }
    const client = await getStorageClient();
    return client.getDirectURL(this.hash);
  }

  async upload(): Promise<string> {
    if (this.hash) {
      return this.hash;
    }
    if (!this.bytes) {
      throw new Error("No bytes to upload");
    }
    const client = await getStorageClient();
    const result = await client.putFile(this.bytes, this.progressCallback);
    this.hash = result.hash;
    return this.hash;
  }
}

export async function uploadImage(file: File, onProgress?: (percentage: number) => void): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = ExternalBlob.fromBytes(bytes);
  if (onProgress) {
    blob.withUploadProgress(onProgress);
  }
  await blob.upload();
  return blob.getDirectURL();
}
