export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  timestamp: number;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: WorkspaceFile[];
}

export interface SessionInfo {
  id: string;
  timestamp: number;
  preview: string;
}

export type CommandType =
  | "lesson-plan"
  | "unit-plan"
  | "report-comments";

export interface AppConfig {
  workspacePath: string | null;
  hasApiKey: boolean;
}

export type SubscriptionKeyStatus =
  | { valid: true; offline?: boolean }
  | { valid: false; message: string }

export type SubscriptionKeyCache = SubscriptionKeyStatus & { checkedAt: number; subscriptionKey: string }

export type SubscriptionKeyStartupStatus = (SubscriptionKeyStatus & { storedKey?: string }) | null
