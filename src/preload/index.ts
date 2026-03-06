import { contextBridge, ipcRenderer } from "electron";
import { IPC, STREAM, WORKSPACE_EVENTS, OUTPUT_EVENTS } from "../shared/ipc-channels";
import type { WorkspaceFile, SessionInfo, SubscriptionKeyStatus, SubscriptionKeyStartupStatus } from "../shared/types";

// Expose typed API to renderer
const api = {
  // Config
  config: {
    getKeyStatus: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC.CONFIG_GET_STATUS),
    setKey: (key: string): Promise<void> =>
      ipcRenderer.invoke(IPC.CONFIG_SET_KEY, key),
    clearKey: (): Promise<void> => ipcRenderer.invoke(IPC.CONFIG_CLEAR_KEY),
    getModel: (): Promise<string> =>
      ipcRenderer.invoke(IPC.CONFIG_GET_MODEL),
    setModel: (model: string): Promise<void> =>
      ipcRenderer.invoke(IPC.CONFIG_SET_MODEL, model),
  },

  // Generated resources (outputs)
  output: {
    listFiles: (): Promise<WorkspaceFile[]> =>
      ipcRenderer.invoke(IPC.OUTPUT_LIST_FILES),
    onFilesChanged: (cb: (files: WorkspaceFile[]) => void): (() => void) => {
      const handler = (_: unknown, files: WorkspaceFile[]) => cb(files);
      ipcRenderer.on(OUTPUT_EVENTS.FILES_CHANGED, handler);
      return () => ipcRenderer.removeListener(OUTPUT_EVENTS.FILES_CHANGED, handler);
    },
  },

  // Workspace
  workspace: {
    getCurrent: (): Promise<string> =>
      ipcRenderer.invoke(IPC.WORKSPACE_GET_CURRENT),
    listFiles: (): Promise<WorkspaceFile[]> =>
      ipcRenderer.invoke(IPC.WORKSPACE_LIST_FILES),
    readFile: (absolutePath: string): Promise<string> =>
      ipcRenderer.invoke(IPC.WORKSPACE_READ_FILE, absolutePath),
    onFilesChanged: (cb: (files: WorkspaceFile[]) => void): (() => void) => {
      const handler = (_: unknown, files: WorkspaceFile[]) => cb(files);
      ipcRenderer.on(WORKSPACE_EVENTS.FILES_CHANGED, handler);
      return () => ipcRenderer.removeListener(WORKSPACE_EVENTS.FILES_CHANGED, handler);
    },
    listContextFiles: (): Promise<WorkspaceFile[]> =>
      ipcRenderer.invoke(IPC.WORKSPACE_LIST_CONTEXT_FILES),
    onContextChanged: (cb: () => void): (() => void) => {
      const handler = () => cb();
      ipcRenderer.on(WORKSPACE_EVENTS.CONTEXT_CHANGED, handler);
      return () => ipcRenderer.removeListener(WORKSPACE_EVENTS.CONTEXT_CHANGED, handler);
    },
  },

  // Context wizard
  context: {
    writeFile: (relativePath: string, content: string): Promise<void> =>
      ipcRenderer.invoke(IPC.CONTEXT_WRITE_FILE, relativePath, content),
  },

  // Curriculum management
  curriculum: {
    listFiles: (): Promise<WorkspaceFile[]> =>
      ipcRenderer.invoke(IPC.CURRICULUM_LIST_FILES),
    importFile: (): Promise<string[]> =>
      ipcRenderer.invoke(IPC.CURRICULUM_IMPORT_FILE),
    deleteFile: (filePath: string): Promise<void> =>
      ipcRenderer.invoke(IPC.CURRICULUM_DELETE_FILE, filePath),
  },

  // File export
  files: {
    export: (sourcePaths: string[]): Promise<boolean> =>
      ipcRenderer.invoke(IPC.FILES_EXPORT, sourcePaths),
  },

  // Commands
  command: {
    buildPrompt: (commandName: string, args: string): Promise<string> =>
      ipcRenderer.invoke(IPC.COMMAND_BUILD_PROMPT, commandName, args),
  },

  // Sessions
  session: {
    list: (): Promise<SessionInfo[]> => ipcRenderer.invoke(IPC.SESSION_LIST),
    loadMessages: (sessionId: string): Promise<{ role: string; content: string }[]> =>
      ipcRenderer.invoke(IPC.SESSION_LOAD_MESSAGES, sessionId),
  },

  // Subscription key
  subscriptionKey: {
    validate: (subscriptionKey: string): Promise<SubscriptionKeyStatus> =>
      ipcRenderer.invoke(IPC.SUBSCRIPTION_KEY_VALIDATE, subscriptionKey),
    getStatus: (): Promise<SubscriptionKeyStartupStatus> =>
      ipcRenderer.invoke(IPC.SUBSCRIPTION_KEY_GET_STATUS),
    clear: (): Promise<void> =>
      ipcRenderer.invoke(IPC.SUBSCRIPTION_KEY_CLEAR),
  },

  // Chat / streaming
  chat: {
    send: (message: string, sessionId?: string): Promise<string> =>
      ipcRenderer.invoke(IPC.CHAT_SEND, { message, sessionId }),
    abort: (): Promise<void> => ipcRenderer.invoke(IPC.CHAT_ABORT),

    onToken: (cb: (token: string) => void): (() => void) => {
      const handler = (_: unknown, token: string) => cb(token);
      ipcRenderer.on(STREAM.TOKEN, handler);
      return () => ipcRenderer.removeListener(STREAM.TOKEN, handler);
    },
    onToolStart: (cb: (toolName: string) => void): (() => void) => {
      const handler = (_: unknown, toolName: string) => cb(toolName);
      ipcRenderer.on(STREAM.TOOL_START, handler);
      return () => ipcRenderer.removeListener(STREAM.TOOL_START, handler);
    },
    onToolEnd: (cb: () => void): (() => void) => {
      const handler = () => cb();
      ipcRenderer.on(STREAM.TOOL_END, handler);
      return () => ipcRenderer.removeListener(STREAM.TOOL_END, handler);
    },
    onAssistantComplete: (cb: (text: string) => void): (() => void) => {
      const handler = (_: unknown, text: string) => cb(text);
      ipcRenderer.on(STREAM.ASSISTANT_COMPLETE, handler);
      return () => ipcRenderer.removeListener(STREAM.ASSISTANT_COMPLETE, handler);
    },
    onError: (cb: (error: string) => void): (() => void) => {
      const handler = (_: unknown, error: string) => cb(error);
      ipcRenderer.on(STREAM.ERROR, handler);
      return () => ipcRenderer.removeListener(STREAM.ERROR, handler);
    },
    onDone: (cb: (data: { sessionId: string }) => void): (() => void) => {
      const handler = (_: unknown, data: { sessionId: string }) => cb(data);
      ipcRenderer.on(STREAM.DONE, handler);
      return () => ipcRenderer.removeListener(STREAM.DONE, handler);
    },
  },
};

contextBridge.exposeInMainWorld("api", api);

export type ElectronAPI = typeof api;
