import { ipcMain, BrowserWindow } from "electron";
import * as path from "path";
import { IPC, WORKSPACE_EVENTS, OUTPUT_EVENTS } from "@shared/ipc-channels";
import {
  hasApiKey,
  setApiKey,
  clearApiKey,
  getWorkspacePath,
  setWorkspacePath,
  getModel,
  setModel,
  getOutputPath,
  setOutputPath,
} from "./config-service";
import {
  selectWorkspaceFolder,
  selectOutputFolder,
  copyTemplateToWorkspace,
  copyCurriculumFiles,
  checkCurriculumFiles,
  listWorkspaceFiles,
  listContextFiles,
  readWorkspaceFile,
  startWatcher,
  startOutputWatcher,
  writeContextFile,
} from "./workspace-service";
import { buildCommandPrompt } from "./command-service";
import { listSessions } from "./session-service";
import { runQuery, abortCurrentQuery } from "./agent-service";

export function registerIpcHandlers(win: BrowserWindow, templatePath: string): void {
  // ── Config ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.CONFIG_GET_STATUS, () => hasApiKey());

  ipcMain.handle(IPC.CONFIG_SET_KEY, (_event, apiKey: string) => {
    setApiKey(apiKey);
  });

  ipcMain.handle(IPC.CONFIG_CLEAR_KEY, () => {
    clearApiKey();
  });

  ipcMain.handle(IPC.CONFIG_GET_MODEL, () => getModel());

  ipcMain.handle(IPC.CONFIG_SET_MODEL, (_event, model: string) => {
    setModel(model);
  });

  ipcMain.handle(IPC.CONFIG_GET_OUTPUT_PATH, () => getOutputPath());

  ipcMain.handle(IPC.CONFIG_SET_OUTPUT_PATH, (_event, p: string) => {
    setOutputPath(p);
  });

  // ── Output folder ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC.OUTPUT_CHECK_CURRICULUM, () => {
    const storedOutput = getOutputPath();
    const wp = getWorkspacePath();
    const outputDir = (storedOutput && storedOutput.trim())
      ? storedOutput
      : wp ? path.join(wp, "outputs") : null;
    if (!outputDir) return { exists: false, fileCount: 0 };
    return checkCurriculumFiles(outputDir);
  });

  ipcMain.handle(IPC.OUTPUT_SELECT_FOLDER, async () => {
    const selected = await selectOutputFolder(win);
    if (selected) {
      setOutputPath(selected);
      copyCurriculumFiles(selected, templatePath);
      startOutputWatcher(selected, win);
    }
    return selected;
  });

  ipcMain.handle(IPC.OUTPUT_LIST_FILES, () => {
    const p = getOutputPath();
    if (!p) return [];
    return listWorkspaceFiles(p, 0, 3);
  });

  // ── Workspace ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.WORKSPACE_GET_CURRENT, () => {
    return getWorkspacePath();
  });

  ipcMain.handle(IPC.WORKSPACE_SELECT, async () => {
    const selected = await selectWorkspaceFolder(win);
    if (!selected) return null;

    // Copy workspace template (won't overwrite existing files; skips reference/)
    copyTemplateToWorkspace(selected, templatePath);

    // Seed curriculum files into the output folder
    const existingOutput = getOutputPath();
    const defaultOutputDir = path.join(selected, "outputs");
    const seedDir = (existingOutput && existingOutput.trim()) ? existingOutput : defaultOutputDir;
    copyCurriculumFiles(seedDir, templatePath);

    setWorkspacePath(selected);
    startWatcher(selected, win);

    return selected;
  });

  ipcMain.handle(IPC.WORKSPACE_LIST_FILES, () => {
    const wp = getWorkspacePath();
    if (!wp) return [];
    return listWorkspaceFiles(wp);
  });

  ipcMain.handle(IPC.WORKSPACE_LIST_CONTEXT_FILES, () => {
    const wp = getWorkspacePath();
    if (!wp) return [];
    return listContextFiles(wp);
  });

  ipcMain.handle(IPC.WORKSPACE_READ_FILE, (_event, absolutePath: string) => {
    return readWorkspaceFile(absolutePath);
  });

  // ── Context wizard ────────────────────────────────────────────────────────
  ipcMain.handle(
    IPC.CONTEXT_WRITE_FILE,
    (_event, relativePath: string, content: string) => {
      const wp = getWorkspacePath();
      if (!wp) throw new Error("No workspace selected");
      const fullPath = path.join(wp, relativePath);
      writeContextFile(fullPath, content);
      win.webContents.send(WORKSPACE_EVENTS.CONTEXT_CHANGED);
    }
  );

  // ── Commands ─────────────────────────────────────────────────────────────
  ipcMain.handle(
    IPC.COMMAND_BUILD_PROMPT,
    (_event, commandName: string, args: string) => {
      const wp = getWorkspacePath();
      if (!wp) throw new Error("No workspace selected");
      return buildCommandPrompt(wp, templatePath, commandName, args);
    }
  );

  // ── Sessions ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SESSION_LIST, async () => {
    const wp = getWorkspacePath();
    if (!wp) return [];
    return listSessions(wp);
  });

  // ── Chat / Agent ──────────────────────────────────────────────────────────
  ipcMain.handle(
    IPC.CHAT_SEND,
    async (_event, payload: { message: string; sessionId?: string }) => {
      const wp = getWorkspacePath();
      if (!wp) throw new Error("No workspace selected");
      return runQuery(win, payload.message, wp, payload.sessionId);
    }
  );

  ipcMain.handle(IPC.CHAT_ABORT, () => {
    abortCurrentQuery();
  });

  // Start output watcher on init if path is already stored
  const storedOutput = getOutputPath();
  if (storedOutput) startOutputWatcher(storedOutput, win);
}
