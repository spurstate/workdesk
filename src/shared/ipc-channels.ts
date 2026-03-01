// Renderer → Main (invoke/handle)
export const IPC = {
  // Config
  CONFIG_GET_STATUS: "config:get-api-key-status",
  CONFIG_SET_KEY: "config:set-api-key",
  CONFIG_CLEAR_KEY: "config:clear-api-key",
  CONFIG_GET_MODEL: "config:get-model",
  CONFIG_SET_MODEL: "config:set-model",
  CONFIG_GET_OUTPUT_PATH: "config:get-output-path",
  CONFIG_SET_OUTPUT_PATH: "config:set-output-path",

  // Output folder
  OUTPUT_SELECT_FOLDER: "output:select-folder",
  OUTPUT_CHECK_CURRICULUM: "output:check-curriculum",
  OUTPUT_LIST_FILES: "output:list-files",

  // Workspace
  WORKSPACE_SELECT: "workspace:select",
  WORKSPACE_GET_CURRENT: "workspace:get-current",
  WORKSPACE_LIST_FILES: "workspace:list-files",
  WORKSPACE_LIST_CONTEXT_FILES: "workspace:list-context-files",
  WORKSPACE_READ_FILE: "workspace:read-file",

  // Chat / agent
  CHAT_SEND: "chat:send-message",
  CHAT_ABORT: "chat:abort",

  // Sessions
  SESSION_LIST: "session:list",

  // Command service
  COMMAND_BUILD_PROMPT: "command:build-prompt",

  // Context wizard
  CONTEXT_WRITE_FILE: "context:write-file",
} as const;

// Main → Renderer (streaming events via webContents.send)
export const STREAM = {
  TOKEN: "stream:token",
  TOOL_START: "stream:tool-start",
  TOOL_END: "stream:tool-end",
  ASSISTANT_COMPLETE: "stream:assistant-complete",
  ERROR: "stream:error",
  DONE: "stream:done",
} as const;

// Main → Renderer (workspace events)
export const WORKSPACE_EVENTS = {
  FILES_CHANGED: "workspace:files-changed",
  CONTEXT_CHANGED: "workspace:context-changed",
} as const;

// Main → Renderer (output folder events)
export const OUTPUT_EVENTS = {
  FILES_CHANGED: "output:files-changed",
} as const;
