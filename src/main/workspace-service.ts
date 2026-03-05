import { BrowserWindow } from "electron";
import * as fs from "fs";
import * as path from "path";
import chokidar, { FSWatcher } from "chokidar";
import { WorkspaceFile } from "@shared/types";
import { WORKSPACE_EVENTS, OUTPUT_EVENTS } from "@shared/ipc-channels";

let watcher: FSWatcher | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

let outputWatcher: FSWatcher | null = null;
let outputDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialise the internal workspace structure under userData.
 * Safe to call on every launch — existing files are not overwritten.
 */
export function initializeWorkspace(
  workspacePath: string,
  templatePath: string
): void {
  // Ensure required directories exist
  for (const dir of ["context", "curriculum", "outputs"]) {
    const p = path.join(workspacePath, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }

  // Seed CLAUDE.md (always overwrite — app-managed)
  const claudeSrc = path.join(templatePath, "CLAUDE.md");
  const claudeDest = path.join(workspacePath, "CLAUDE.md");
  if (fs.existsSync(claudeSrc)) {
    fs.copyFileSync(claudeSrc, claudeDest);
  }

  // Seed context template files (skip if already present — user may have filled them in)
  const contextSrc = path.join(templatePath, "context");
  const contextDest = path.join(workspacePath, "context");
  if (fs.existsSync(contextSrc)) {
    copyDirOnce(contextSrc, contextDest);
  }

  // Seed curriculum reference files from template/reference/ (skip if present)
  const refSrc = path.join(templatePath, "reference");
  const curriculumDest = path.join(workspacePath, "curriculum");
  if (fs.existsSync(refSrc)) {
    copyDirOnce(refSrc, curriculumDest);
  }
}

/** Copy all files from src → dest, skipping any that already exist. */
function copyDirOnce(src: string, dest: string): void {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirOnce(srcPath, destPath);
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
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
    ignored: /(^|[/\\])\../,
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

export function listCurriculumFiles(workspacePath: string): WorkspaceFile[] {
  const curriculumDir = path.join(workspacePath, "curriculum");
  if (!fs.existsSync(curriculumDir)) return [];
  return fs
    .readdirSync(curriculumDir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => ({ name: e.name, path: path.join(curriculumDir, e.name), isDirectory: false }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function importCurriculumFiles(
  workspacePath: string,
  sourcePaths: string[]
): void {
  const destDir = path.join(workspacePath, "curriculum");
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const src of sourcePaths) {
    const name = path.basename(src);
    fs.copyFileSync(src, path.join(destDir, name));
  }
}

export function deleteCurriculumFile(filePath: string): void {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function exportFiles(sourcePaths: string[], destDir: string): void {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const src of sourcePaths) {
    const name = path.basename(src);
    fs.copyFileSync(src, path.join(destDir, name));
  }
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
