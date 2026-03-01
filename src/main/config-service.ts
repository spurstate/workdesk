import { safeStorage } from "electron";
import Store from "electron-store";

interface StoreSchema {
  encryptedApiKey?: string;
  workspacePath?: string;
  outputPath?: string;
  model?: string;
}

const store = new Store<StoreSchema>();

export function hasApiKey(): boolean {
  const encrypted = store.get("encryptedApiKey");
  return !!encrypted;
}

export function setApiKey(apiKey: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    store.set("encryptedApiKey", Buffer.from(apiKey).toString("base64"));
    return;
  }
  const encrypted = safeStorage.encryptString(apiKey);
  store.set("encryptedApiKey", encrypted.toString("base64"));
}

export function getApiKey(): string | null {
  const stored = store.get("encryptedApiKey");
  if (!stored) return null;

  try {
    if (!safeStorage.isEncryptionAvailable()) {
      return Buffer.from(stored, "base64").toString("utf8");
    }
    const buffer = Buffer.from(stored, "base64");
    return safeStorage.decryptString(buffer);
  } catch {
    return null;
  }
}

export function clearApiKey(): void {
  store.delete("encryptedApiKey");
}

export function getWorkspacePath(): string | null {
  return store.get("workspacePath") ?? null;
}

export function setWorkspacePath(path: string): void {
  store.set("workspacePath", path);
}

export function getOutputPath(): string | null {
  return store.get("outputPath") ?? null;
}

export function setOutputPath(p: string): void {
  store.set("outputPath", p);
}

export function getModel(): string {
  return store.get("model") ?? "claude-haiku-4-5-20251001";
}

export function setModel(model: string): void {
  store.set("model", model);
}
