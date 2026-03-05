import { ipcMain, BrowserWindow, dialog } from "electron";
import * as path from "path";
import { IPC, WORKSPACE_EVENTS } from "@shared/ipc-channels";
import {
  hasApiKey,
  setApiKey,
  clearApiKey,
  getWorkspacePath,
  getModel,
  setModel,
} from "./config-service";
import {
  listWorkspaceFiles,
  listContextFiles,
  listCurriculumFiles,
  importCurriculumFiles,
  deleteCurriculumFile,
  exportFiles,
  readWorkspaceFile,
  writeContextFile,
} from "./workspace-service";
import { buildCommandPrompt } from "./command-service";
import { listSessions, loadSessionMessages } from "./session-service";
import { runQuery, abortCurrentQuery } from "./agent-service";

export function registerIpcHandlers(win: BrowserWindow, templatePath: string): void {
  const wp = (): string => getWorkspacePath();

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

  // ── Generated resources (outputs) ────────────────────────────────────────
  ipcMain.handle(IPC.OUTPUT_LIST_FILES, () => {
    return listWorkspaceFiles(path.join(wp(), "outputs"), 0, 3);
  });

  // ── Workspace ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.WORKSPACE_GET_CURRENT, () => wp());

  ipcMain.handle(IPC.WORKSPACE_LIST_FILES, () => {
    return listWorkspaceFiles(wp());
  });

  ipcMain.handle(IPC.WORKSPACE_LIST_CONTEXT_FILES, () => {
    return listContextFiles(wp());
  });

  ipcMain.handle(IPC.WORKSPACE_READ_FILE, (_event, absolutePath: string) => {
    return readWorkspaceFile(absolutePath);
  });

  // ── Context wizard ────────────────────────────────────────────────────────
  ipcMain.handle(
    IPC.CONTEXT_WRITE_FILE,
    (_event, relativePath: string, content: string) => {
      const fullPath = path.join(wp(), relativePath);
      writeContextFile(fullPath, content);
      win.webContents.send(WORKSPACE_EVENTS.CONTEXT_CHANGED);
    }
  );

  // ── Curriculum ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.CURRICULUM_LIST_FILES, () => {
    return listCurriculumFiles(wp());
  });

  ipcMain.handle(IPC.CURRICULUM_IMPORT_FILE, async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile", "multiSelections"],
      title: "Import Curriculum Files",
      buttonLabel: "Import",
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (result.canceled || result.filePaths.length === 0) return [];
    importCurriculumFiles(wp(), result.filePaths);
    return result.filePaths.map((p) => path.basename(p));
  });

  ipcMain.handle(IPC.CURRICULUM_DELETE_FILE, (_event, filePath: string) => {
    deleteCurriculumFile(filePath);
  });

  // ── File export ───────────────────────────────────────────────────────────
  ipcMain.handle(IPC.FILES_EXPORT, async (_event, sourcePaths: string[]) => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"],
      title: "Choose Export Destination",
      buttonLabel: "Export Here",
    });
    if (result.canceled || result.filePaths.length === 0) return false;
    exportFiles(sourcePaths, result.filePaths[0]);
    return true;
  });

  // ── Commands ─────────────────────────────────────────────────────────────
  ipcMain.handle(
    IPC.COMMAND_BUILD_PROMPT,
    (_event, commandName: string, args: string) => {
      return buildCommandPrompt(wp(), templatePath, commandName, args);
    }
  );

  // ── Sessions ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SESSION_LIST, async () => {
    return listSessions(wp());
  });

  ipcMain.handle(IPC.SESSION_LOAD_MESSAGES, (_event, sessionId: string) => {
    return loadSessionMessages(wp(), sessionId);
  });

  // ── Chat / Agent ──────────────────────────────────────────────────────────
  ipcMain.handle(
    IPC.CHAT_SEND,
    async (_event, payload: { message: string; sessionId?: string }) => {
      return runQuery(win, payload.message, wp(), payload.sessionId);
    }
  );

  ipcMain.handle(IPC.CHAT_ABORT, () => {
    abortCurrentQuery();
  });
}
