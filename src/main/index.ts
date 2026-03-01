import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { execFileSync } from "child_process";
import * as fs from "fs";
import { getWorkspacePath, getOutputPath } from "./config-service";
import { startWatcher, stopWatcher, copyCurriculumFiles } from "./workspace-service";
import { registerIpcHandlers } from "./ipc-handlers";

// Fix PATH for packaged app on macOS.
// Electron launches without the user's shell PATH so Node.js (spawned by the
// Claude Agent SDK) can't be found. We try two strategies in order:
//  1. Run a login shell (-l) to read the real PATH — same approach as fix-path pkg
//  2. Fallback: manually prepend nvm and Homebrew bin directories
function fixShellPath(): void {
  if (process.platform === "win32") return;

  const home = process.env.HOME ?? "";
  const nvmDir = process.env.NVM_DIR ?? `${home}/.nvm`;

  // Strategy 1: login shell gives us the fully-resolved PATH without needing a TTY
  try {
    const shellBin = process.env.SHELL ?? "/bin/zsh";
    const shellPath = execFileSync(shellBin, ["-l", "-c", "echo -n $PATH"], {
      encoding: "utf8",
      timeout: 5000,
    });
    if (shellPath && shellPath.includes("/")) {
      process.env.PATH = shellPath;
      return;
    }
  } catch {
    // fall through to strategy 2
  }

  // Strategy 2: prepend known locations, including all installed nvm versions
  const extras: string[] = [
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin",
  ];

  try {
    const versionsDir = `${nvmDir}/versions/node`;
    if (fs.existsSync(versionsDir)) {
      // Add every installed nvm version (most recent first)
      const versions = fs.readdirSync(versionsDir).sort().reverse();
      for (const v of versions.slice(0, 5)) {
        extras.push(`${versionsDir}/${v}/bin`);
      }
    }
  } catch {
    // ignore
  }

  process.env.PATH = [...extras, process.env.PATH ?? ""].join(":");
}

fixShellPath();

// Determine workspace template path (works in dev and packaged builds)
function getTemplatePath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, "workspace-template");
  }
  return join(__dirname, "../../resources/workspace-template");
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Spurstate Workdesk",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    backgroundColor: "#1e1e2e",
    show: false,
  });

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
}

app.whenReady().then(() => {
  const win = createWindow();
  const templatePath = getTemplatePath();

  registerIpcHandlers(win, templatePath);

  // Start watching existing workspace if setup already done
  const existingWorkspace = getWorkspacePath();
  if (existingWorkspace) {
    // Silently re-seed any missing curriculum files (no-op if already present)
    const existingOutput = getOutputPath();
    const defaultOutputDir = join(existingWorkspace, "outputs");
    const seedDir = (existingOutput && existingOutput.trim()) ? existingOutput : defaultOutputDir;
    copyCurriculumFiles(seedDir, templatePath);

    startWatcher(existingWorkspace, win);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopWatcher();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
