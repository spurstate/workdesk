"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const Store = require("electron-store");
const chokidar = require("chokidar");
const os = require("os");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const store = new Store();
const TEST_READY = process.env.TEST_READY === "true";
const TEST_MODE$1 = process.env.TEST_MODE === "true";
function hasApiKey() {
  if (TEST_READY) return true;
  const encrypted = store.get("encryptedApiKey");
  return !!encrypted;
}
function setApiKey(apiKey) {
  if (TEST_MODE$1) {
    store.set("encryptedApiKey", Buffer.from(apiKey).toString("base64"));
    return;
  }
  if (!electron.safeStorage.isEncryptionAvailable()) {
    store.set("encryptedApiKey", Buffer.from(apiKey).toString("base64"));
    return;
  }
  const encrypted = electron.safeStorage.encryptString(apiKey);
  store.set("encryptedApiKey", encrypted.toString("base64"));
}
function getApiKey() {
  if (TEST_READY) return "sk-ant-test";
  const stored = store.get("encryptedApiKey");
  if (!stored) return null;
  try {
    if (TEST_MODE$1 || !electron.safeStorage.isEncryptionAvailable()) {
      return Buffer.from(stored, "base64").toString("utf8");
    }
    const buffer = Buffer.from(stored, "base64");
    return electron.safeStorage.decryptString(buffer);
  } catch {
    return null;
  }
}
function clearApiKey() {
  store.delete("encryptedApiKey");
}
function getWorkspacePath() {
  if (TEST_READY) return process.env.TEST_WORKSPACE_DIR ?? null;
  return store.get("workspacePath") ?? null;
}
function setWorkspacePath(path2) {
  store.set("workspacePath", path2);
}
function isSetupComplete() {
  if (TEST_READY) return true;
  return store.get("setupComplete") ?? false;
}
const IPC = {
  // Config
  CONFIG_GET_STATUS: "config:get-api-key-status",
  CONFIG_SET_KEY: "config:set-api-key",
  CONFIG_CLEAR_KEY: "config:clear-api-key",
  // Workspace
  WORKSPACE_SELECT: "workspace:select",
  WORKSPACE_GET_CURRENT: "workspace:get-current",
  WORKSPACE_LIST_FILES: "workspace:list-files",
  WORKSPACE_READ_FILE: "workspace:read-file",
  // Chat / agent
  CHAT_SEND: "chat:send-message",
  CHAT_ABORT: "chat:abort",
  // Sessions
  SESSION_LIST: "session:list",
  // Command service
  COMMAND_BUILD_PROMPT: "command:build-prompt",
  // Context wizard
  CONTEXT_WRITE_FILE: "context:write-file"
};
const STREAM = {
  TOKEN: "stream:token",
  TOOL_START: "stream:tool-start",
  TOOL_END: "stream:tool-end",
  ASSISTANT_COMPLETE: "stream:assistant-complete",
  ERROR: "stream:error",
  DONE: "stream:done"
};
const WORKSPACE_EVENTS = {
  FILES_CHANGED: "workspace:files-changed"
};
const TEST_MODE = process.env.TEST_MODE === "true";
let watcher = null;
async function selectWorkspaceFolder(win) {
  if (TEST_MODE) {
    const dir = process.env.TEST_WORKSPACE_DIR;
    if (dir) {
      fs__namespace.mkdirSync(dir, { recursive: true });
      return dir;
    }
  }
  const result = await electron.dialog.showOpenDialog(win, {
    properties: ["openDirectory", "createDirectory"],
    title: "Select or create your teaching workspace folder",
    buttonLabel: "Use This Folder"
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}
function copyTemplateToWorkspace(workspacePath, templatePath) {
  if (!fs__namespace.existsSync(templatePath)) return;
  copyDirRecursive(templatePath, workspacePath);
}
function copyDirRecursive(src, dest) {
  if (!fs__namespace.existsSync(dest)) {
    fs__namespace.mkdirSync(dest, { recursive: true });
  }
  const entries = fs__namespace.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path__namespace.join(src, entry.name);
    const destPath = path__namespace.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      if (!fs__namespace.existsSync(destPath)) {
        fs__namespace.copyFileSync(srcPath, destPath);
      }
    }
  }
}
function listWorkspaceFiles(workspacePath, depth = 0, maxDepth = 2) {
  if (!fs__namespace.existsSync(workspacePath)) return [];
  const entries = fs__namespace.readdirSync(workspacePath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const fullPath = path__namespace.join(workspacePath, entry.name);
    const file = {
      name: entry.name,
      path: fullPath,
      isDirectory: entry.isDirectory()
    };
    if (entry.isDirectory() && depth < maxDepth) {
      file.children = listWorkspaceFiles(fullPath, depth + 1, maxDepth);
    }
    files.push(file);
  }
  return files.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
function startWatcher(workspacePath, win) {
  stopWatcher();
  watcher = chokidar.watch(workspacePath, {
    ignored: /(^|[/\\])\../,
    // ignore hidden
    ignoreInitial: true,
    depth: 2
  });
  const refresh = () => {
    const files = listWorkspaceFiles(workspacePath);
    win.webContents.send(WORKSPACE_EVENTS.FILES_CHANGED, files);
  };
  watcher.on("add", refresh);
  watcher.on("unlink", refresh);
  watcher.on("addDir", refresh);
  watcher.on("unlinkDir", refresh);
}
function stopWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
function readWorkspaceFile(absolutePath) {
  return fs__namespace.readFileSync(absolutePath, "utf8");
}
function writeContextFile(filePath, content) {
  const dir = path__namespace.dirname(filePath);
  if (!fs__namespace.existsSync(dir)) {
    fs__namespace.mkdirSync(dir, { recursive: true });
  }
  fs__namespace.writeFileSync(filePath, content, "utf8");
}
function buildCommandPrompt(workspacePath, commandName, args) {
  const commandPath = path__namespace.join(
    workspacePath,
    ".claude",
    "commands",
    `${commandName}.md`
  );
  if (!fs__namespace.existsSync(commandPath)) {
    throw new Error(`Command file not found: ${commandPath}`);
  }
  const template = fs__namespace.readFileSync(commandPath, "utf8");
  return template.replace(/\$ARGUMENTS/g, args);
}
async function listSessions(workspacePath) {
  try {
    const sessionsDir = path__namespace.join(workspacePath, ".claude", "sessions");
    if (!fs__namespace.existsSync(sessionsDir)) return [];
    const entries = fs__namespace.readdirSync(sessionsDir, { withFileTypes: true });
    const sessions = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const filePath = path__namespace.join(sessionsDir, entry.name);
      try {
        const raw = fs__namespace.readFileSync(filePath, "utf8");
        const data = JSON.parse(raw);
        const messages = data.messages ?? [];
        const firstUser = messages.find(
          (m) => m.role === "user"
        );
        const preview = typeof firstUser?.content === "string" ? firstUser.content.slice(0, 80) : typeof firstUser?.content?.[0]?.text === "string" ? firstUser.content[0].text.slice(0, 80) : "Session";
        const stat = fs__namespace.statSync(filePath);
        sessions.push({
          id: entry.name.replace(".json", ""),
          timestamp: stat.mtimeMs,
          preview
        });
      } catch {
      }
    }
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}
function debugLog(message) {
  try {
    const logPath = path__namespace.join(os__namespace.homedir(), "Desktop", "teacher-assistant-debug.log");
    const line = `${(/* @__PURE__ */ new Date()).toISOString()}: ${message}
`;
    fs__namespace.appendFileSync(logPath, line);
  } catch {
  }
}
function getCliJsPath() {
  if (electron.app.isPackaged) {
    const appPath = electron.app.getAppPath();
    const unpacked = appPath.replace(/app\.asar$/, "app.asar.unpacked");
    return path__namespace.join(unpacked, "node_modules/@anthropic-ai/claude-agent-sdk/cli.js");
  }
  return path__namespace.join(__dirname, "../../node_modules/@anthropic-ai/claude-agent-sdk/cli.js");
}
function findNodeBin() {
  const home = process.env.HOME ?? "";
  const nvmDir = process.env.NVM_DIR ?? `${home}/.nvm`;
  try {
    const versionsDir = `${nvmDir}/versions/node`;
    if (fs__namespace.existsSync(versionsDir)) {
      const versions = fs__namespace.readdirSync(versionsDir).sort((a, b) => {
        const pa = a.replace(/^v/, "").split(".").map(Number);
        const pb = b.replace(/^v/, "").split(".").map(Number);
        for (let i = 0; i < 3; i++) {
          if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0);
        }
        return 0;
      });
      for (const v of versions) {
        const major = parseInt(v.replace(/^v/, ""), 10);
        if (major < 18) continue;
        const nodeBin = `${versionsDir}/${v}/bin/node`;
        if (fs__namespace.existsSync(nodeBin)) return nodeBin;
      }
    }
  } catch {
  }
  try {
    const result = child_process.execFileSync("/usr/bin/which", ["node"], {
      encoding: "utf8",
      env: process.env,
      timeout: 3e3
    }).trim().split("\n").pop() ?? "";
    if (result && result.startsWith("/") && fs__namespace.existsSync(result)) {
      return result;
    }
  } catch {
  }
  return "node";
}
let queryFn = null;
async function getQuery() {
  if (!queryFn) {
    const sdk = await import("@anthropic-ai/claude-agent-sdk");
    queryFn = sdk.query;
  }
  return queryFn;
}
let currentAbortController = null;
function abortCurrentQuery() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}
async function runMockQuery(win) {
  const mockText = "This is a mock response from Claude for testing purposes. It streams in word by word.";
  const words = mockText.split(" ");
  for (const word of words) {
    await new Promise((r) => setTimeout(r, 20));
    win.webContents.send(STREAM.TOKEN, word + " ");
  }
  win.webContents.send(STREAM.ASSISTANT_COMPLETE, mockText);
  const sessionId = "test-session-" + Date.now();
  win.webContents.send(STREAM.DONE, { sessionId });
  return sessionId;
}
async function runQuery(win, prompt, workspacePath, sessionId) {
  if (process.env.TEST_MODE === "true") {
    return runMockQuery(win);
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No API key configured");
  }
  abortCurrentQuery();
  const abortController = new AbortController();
  currentAbortController = abortController;
  const query = await getQuery();
  let assembledText = "";
  let currentToolName = "";
  let finalSessionId = sessionId ?? "";
  try {
    const nodeBin = findNodeBin();
    const cliJsPath = getCliJsPath();
    const env = { ...process.env, ANTHROPIC_API_KEY: apiKey };
    delete env.CLAUDECODE;
    debugLog(`runQuery: nodeBin=${nodeBin} cliJsPath=${cliJsPath} cwd=${workspacePath}`);
    const q = query({
      prompt,
      options: {
        cwd: workspacePath,
        model: "claude-sonnet-4-6",
        systemPrompt: { type: "preset", preset: "claude_code" },
        settingSources: ["project"],
        tools: { type: "preset", preset: "claude_code" },
        includePartialMessages: true,
        permissionMode: "acceptEdits",
        executable: nodeBin,
        pathToClaudeCodeExecutable: cliJsPath,
        env,
        stderr: (data) => {
          debugLog(`SDK stderr: ${data.trim()}`);
          console.error("[Claude SDK]", data);
          win.webContents.send(STREAM.ERROR, `[Debug] ${data.trim()}`);
        },
        ...sessionId ? { resume: sessionId } : {},
        abortController
      }
    });
    for await (const message of q) {
      if (abortController.signal.aborted) break;
      const msgType = message.type;
      if (msgType === "stream_event") {
        const event = message.event;
        if (event?.type === "content_block_delta" && event?.delta?.type === "text_delta") {
          const token = event.delta.text;
          assembledText += token;
          win.webContents.send(STREAM.TOKEN, token);
        }
        if (event?.type === "content_block_start") {
          if (event?.content_block?.type === "tool_use") {
            currentToolName = event.content_block.name ?? "tool";
            win.webContents.send(STREAM.TOOL_START, currentToolName);
          }
        }
        if (event?.type === "content_block_stop" && currentToolName) {
          win.webContents.send(STREAM.TOOL_END);
          currentToolName = "";
        }
      }
      if (msgType === "assistant") {
        const content = message.message?.content ?? [];
        const textBlock = content.find(
          (b) => b.type === "text"
        );
        if (textBlock?.text) {
          assembledText = textBlock.text;
          win.webContents.send(STREAM.ASSISTANT_COMPLETE, assembledText);
        }
      }
      if (msgType === "result") {
        finalSessionId = message.session_id ?? finalSessionId;
        win.webContents.send(STREAM.DONE, { sessionId: finalSessionId });
      }
    }
  } catch (err) {
    if (err?.name !== "AbortError") {
      const errMsg = err?.message ?? "Unknown error";
      win.webContents.send(STREAM.ERROR, errMsg);
      throw err;
    }
  } finally {
    if (currentAbortController === abortController) {
      currentAbortController = null;
    }
  }
  return finalSessionId;
}
function registerIpcHandlers(win, templatePath) {
  electron.ipcMain.handle(IPC.CONFIG_GET_STATUS, () => hasApiKey());
  electron.ipcMain.handle(IPC.CONFIG_SET_KEY, (_event, apiKey) => {
    setApiKey(apiKey);
  });
  electron.ipcMain.handle(IPC.CONFIG_CLEAR_KEY, () => {
    clearApiKey();
  });
  electron.ipcMain.handle(IPC.WORKSPACE_GET_CURRENT, () => {
    return getWorkspacePath();
  });
  electron.ipcMain.handle(IPC.WORKSPACE_SELECT, async () => {
    const selected = await selectWorkspaceFolder(win);
    if (!selected) return null;
    copyTemplateToWorkspace(selected, templatePath);
    setWorkspacePath(selected);
    startWatcher(selected, win);
    return selected;
  });
  electron.ipcMain.handle(IPC.WORKSPACE_LIST_FILES, () => {
    const wp = getWorkspacePath();
    if (!wp) return [];
    return listWorkspaceFiles(wp);
  });
  electron.ipcMain.handle(IPC.WORKSPACE_READ_FILE, (_event, absolutePath) => {
    return readWorkspaceFile(absolutePath);
  });
  electron.ipcMain.handle(
    IPC.CONTEXT_WRITE_FILE,
    (_event, relativePath, content) => {
      const wp = getWorkspacePath();
      if (!wp) throw new Error("No workspace selected");
      const fullPath = path__namespace.join(wp, relativePath);
      writeContextFile(fullPath, content);
    }
  );
  electron.ipcMain.handle(
    IPC.COMMAND_BUILD_PROMPT,
    (_event, commandName, args) => {
      const wp = getWorkspacePath();
      if (!wp) throw new Error("No workspace selected");
      return buildCommandPrompt(wp, commandName, args);
    }
  );
  electron.ipcMain.handle(IPC.SESSION_LIST, async () => {
    const wp = getWorkspacePath();
    if (!wp) return [];
    return listSessions(wp);
  });
  electron.ipcMain.handle(
    IPC.CHAT_SEND,
    async (_event, payload) => {
      const wp = getWorkspacePath();
      if (!wp) throw new Error("No workspace selected");
      return runQuery(win, payload.message, wp, payload.sessionId);
    }
  );
  electron.ipcMain.handle(IPC.CHAT_ABORT, () => {
    abortCurrentQuery();
  });
}
function fixShellPath() {
  if (process.platform === "win32") return;
  const home = process.env.HOME ?? "";
  const nvmDir = process.env.NVM_DIR ?? `${home}/.nvm`;
  try {
    const shellBin = process.env.SHELL ?? "/bin/zsh";
    const shellPath = child_process.execFileSync(shellBin, ["-l", "-c", "echo -n $PATH"], {
      encoding: "utf8",
      timeout: 5e3
    });
    if (shellPath && shellPath.includes("/")) {
      process.env.PATH = shellPath;
      return;
    }
  } catch {
  }
  const extras = [
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin"
  ];
  try {
    const versionsDir = `${nvmDir}/versions/node`;
    if (fs__namespace.existsSync(versionsDir)) {
      const versions = fs__namespace.readdirSync(versionsDir).sort().reverse();
      for (const v of versions.slice(0, 5)) {
        extras.push(`${versionsDir}/${v}/bin`);
      }
    }
  } catch {
  }
  process.env.PATH = [...extras, process.env.PATH ?? ""].join(":");
}
fixShellPath();
if (process.env.TEST_USER_DATA_DIR) {
  electron.app.setPath("userData", process.env.TEST_USER_DATA_DIR);
}
if (process.env.TEST_MODE === "true") {
  electron.app.commandLine.appendSwitch("remote-debugging-port", "0");
}
function getTemplatePath() {
  if (electron.app.isPackaged) {
    return path.join(process.resourcesPath, "workspace-template");
  }
  return path.join(__dirname, "../../resources/workspace-template");
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Teaching Assistant",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    backgroundColor: "#1e1e2e",
    show: false
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  win.once("ready-to-show", () => {
    win.show();
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  return win;
}
electron.app.whenReady().then(() => {
  const win = createWindow();
  const templatePath = getTemplatePath();
  registerIpcHandlers(win, templatePath);
  const existingWorkspace = getWorkspacePath();
  if (existingWorkspace && isSetupComplete()) {
    startWatcher(existingWorkspace, win);
  }
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  stopWatcher();
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
