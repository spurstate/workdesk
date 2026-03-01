import { dialog, BrowserWindow } from "electron";
import * as fs from "fs";
import * as path from "path";
import chokidar, { FSWatcher } from "chokidar";
import { WorkspaceFile } from "@shared/types";
import { WORKSPACE_EVENTS, OUTPUT_EVENTS } from "@shared/ipc-channels";

let watcher: FSWatcher | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

let outputWatcher: FSWatcher | null = null;
let outputDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function selectWorkspaceFolder(
  win: BrowserWindow
): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory", "createDirectory"],
    title: "Select or create your teaching workspace folder",
    buttonLabel: "Use This Folder",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}

export async function selectOutputFolder(
  win: BrowserWindow
): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory", "createDirectory"],
    title: "Choose where to save generated files",
    buttonLabel: "Use This Folder",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}

export function copyTemplateToWorkspace(
  workspacePath: string,
  templatePath: string
): void {
  if (!fs.existsSync(templatePath)) return;
  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }
  // Skip the reference/ folder — curriculum files now live in the output folder instead
  const entries = fs.readdirSync(templatePath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "reference") continue;
    const srcPath = path.join(templatePath, entry.name);
    const destPath = path.join(workspacePath, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      // Always overwrite CLAUDE.md — it's managed by the app, not user-edited
      if (entry.name === "CLAUDE.md" || !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

export function checkCurriculumFiles(outputDir: string): { exists: boolean; fileCount: number } {
  const curriculumDir = path.join(outputDir, "curriculum");
  if (!fs.existsSync(curriculumDir)) return { exists: false, fileCount: 0 };
  const files = fs.readdirSync(curriculumDir).filter((f) => f.endsWith(".md"));
  return { exists: true, fileCount: files.length };
}

export function copyCurriculumFiles(
  outputDir: string,
  templatePath: string
): void {
  const srcDir = path.join(templatePath, "reference");
  if (!fs.existsSync(srcDir)) return;
  const destDir = path.join(outputDir, "curriculum");
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    // Don't overwrite — teacher may have customised these files
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      // Don't overwrite existing files (teacher may have customised them)
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

export function listWorkspaceFiles(
  workspacePath: string,
  depth = 0,
  maxDepth = 2
): WorkspaceFile[] {
  if (!fs.existsSync(workspacePath)) return [];
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  const files: WorkspaceFile[] = [];

  for (const entry of entries) {
    // Skip hidden files and node_modules
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const fullPath = path.join(workspacePath, entry.name);
    const file: WorkspaceFile = {
      name: entry.name,
      path: fullPath,
      isDirectory: entry.isDirectory(),
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

export function startWatcher(
  workspacePath: string,
  win: BrowserWindow
): void {
  stopWatcher();
  watcher = chokidar.watch(workspacePath, {
    ignored: /(^|[/\\])\../, // ignore hidden
    ignoreInitial: true,
    depth: 2,
  });

  const refresh = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const files = listWorkspaceFiles(workspacePath);
      win.webContents.send(WORKSPACE_EVENTS.FILES_CHANGED, files);
    }, 300);
  };

  watcher.on("add", refresh);
  watcher.on("unlink", refresh);
  watcher.on("addDir", refresh);
  watcher.on("unlinkDir", refresh);
}

export function stopWatcher(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export function readWorkspaceFile(absolutePath: string): string {
  const stat = fs.statSync(absolutePath);
  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large to preview (${Math.round(stat.size / 1024)}KB). Maximum size is 1MB.`
    );
  }
  return fs.readFileSync(absolutePath, "utf8");
}

export function writeContextFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf8");
}

export function listContextFiles(workspacePath: string): WorkspaceFile[] {
  const result: WorkspaceFile[] = [];

  const claudeMdPath = path.join(workspacePath, "CLAUDE.md");
  if (fs.existsSync(claudeMdPath)) {
    result.push({ name: "CLAUDE.md", path: claudeMdPath, isDirectory: false });
  }

  const contextDir = path.join(workspacePath, "context");
  if (fs.existsSync(contextDir)) {
    const children = fs
      .readdirSync(contextDir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => ({ name: e.name, path: path.join(contextDir, e.name), isDirectory: false }))
      .sort((a, b) => a.name.localeCompare(b.name));
    result.push({ name: "context", path: contextDir, isDirectory: true, children });
  }

  return result;
}

export function startOutputWatcher(outputPath: string, win: BrowserWindow): void {
  stopOutputWatcher();
  outputWatcher = chokidar.watch(outputPath, {
    ignored: /(^|[/\\])\../,
    ignoreInitial: true,
    depth: 3,
  });

  const refresh = (): void => {
    if (outputDebounceTimer) clearTimeout(outputDebounceTimer);
    outputDebounceTimer = setTimeout(() => {
      outputDebounceTimer = null;
      const files = listWorkspaceFiles(outputPath, 0, 3);
      win.webContents.send(OUTPUT_EVENTS.FILES_CHANGED, files);
    }, 300);
  };

  outputWatcher.on("add", refresh);
  outputWatcher.on("unlink", refresh);
  outputWatcher.on("addDir", refresh);
  outputWatcher.on("unlinkDir", refresh);
}

export function stopOutputWatcher(): void {
  if (outputDebounceTimer) {
    clearTimeout(outputDebounceTimer);
    outputDebounceTimer = null;
  }
  if (outputWatcher) {
    outputWatcher.close();
    outputWatcher = null;
  }
}
