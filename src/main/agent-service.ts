import { BrowserWindow, app } from "electron";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { STREAM } from "@shared/ipc-channels";
import { getApiKey, getModel } from "./config-service";

// Write a timestamped line to ~/Desktop/teacher-assistant-debug.log
function debugLog(message: string): void {
  try {
    const logPath = path.join(os.homedir(), "Desktop", "teacher-assistant-debug.log");
    const line = `${new Date().toISOString()}: ${message}\n`;
    fs.appendFileSync(logPath, line);
  } catch {
    // ignore logging errors
  }
}

// Resolve the path to the SDK's cli.js — works in both dev and packaged builds.
// In packaged builds the SDK is in app.asar.unpacked (WASM files force it there),
// so we use that path rather than the asar URL that import.meta.url would return.
function getCliJsPath(): string {
  if (app.isPackaged) {
    const appPath = app.getAppPath(); // e.g. /…/app.asar
    const unpacked = appPath.replace(/app\.asar$/, "app.asar.unpacked");
    return path.join(unpacked, "node_modules/@anthropic-ai/claude-agent-sdk/cli.js");
  }
  // Dev mode: __dirname is out/main — go up two levels to the project root
  return path.join(__dirname, "../../node_modules/@anthropic-ai/claude-agent-sdk/cli.js");
}

// Find the absolute path to a Node.js binary >= v18 (required by the SDK).
// Strategy 1: scan ~/.nvm/versions/node/ for the most recent installed version >= 18
// Strategy 2: ask /usr/bin/which — but only if the result is >= v18
// Strategy 3: fall back to "node" and hope PATH is correct
function findNodeBin(): string {
  const home = process.env.HOME ?? "";
  const nvmDir = process.env.NVM_DIR ?? `${home}/.nvm`;

  // Strategy 1: nvm — pick the most recent version that is >= 18
  try {
    const versionsDir = `${nvmDir}/versions/node`;
    if (fs.existsSync(versionsDir)) {
      // Sort semver-style: strip leading 'v', split on '.', compare numerically
      const versions = fs.readdirSync(versionsDir).sort((a, b) => {
        const pa = a.replace(/^v/, "").split(".").map(Number);
        const pb = b.replace(/^v/, "").split(".").map(Number);
        for (let i = 0; i < 3; i++) {
          if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0);
        }
        return 0;
      });
      for (const v of versions) {
        const major = parseInt(v.replace(/^v/, ""), 10);
        if (major < 18) continue; // SDK requires Node >= 18
        const nodeBin = `${versionsDir}/${v}/bin/node`;
        if (fs.existsSync(nodeBin)) return nodeBin;
      }
    }
  } catch {
    // fall through
  }

  // Strategy 2: which node — accept only if >= v18
  try {
    const result = execFileSync("/usr/bin/which", ["node"], {
      encoding: "utf8",
      env: process.env,
      timeout: 3000,
    })
      .trim()
      .split("\n")
      .pop() ?? "";
    if (result && result.startsWith("/") && fs.existsSync(result)) {
      return result;
    }
  } catch {
    // fall through
  }

  return "node"; // last resort
}

// Dynamic import to avoid bundling issues with the SDK
let queryFn: typeof import("@anthropic-ai/claude-agent-sdk").query | null =
  null;

async function getQuery() {
  if (!queryFn) {
    const sdk = await import("@anthropic-ai/claude-agent-sdk");
    queryFn = sdk.query;
  }
  return queryFn;
}

let currentAbortController: AbortController | null = null;

export function abortCurrentQuery(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

export async function runQuery(
  win: BrowserWindow,
  prompt: string,
  workspacePath: string,
  sessionId?: string
): Promise<string> {
  abortCurrentQuery();
  const abortController = new AbortController();
  currentAbortController = abortController;

  const query = await getQuery();

  let assembledText = "";
  let currentToolName = "";
  let finalSessionId = sessionId ?? "";
  let doneSent = false;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("No API key configured");
    }

    const nodeBin = findNodeBin();
    const cliJsPath = getCliJsPath();

    // Build a clean env: spread current env, inject API key, and explicitly
    // remove CLAUDECODE so the SDK doesn't think it's running inside another
    // Claude Code session (which causes an immediate exit-code-1 crash).
    const env = { ...process.env, ANTHROPIC_API_KEY: apiKey };
    delete (env as Record<string, string | undefined>).CLAUDECODE;

    debugLog(`runQuery: nodeBin=${nodeBin} cliJsPath=${cliJsPath} cwd=${workspacePath} sessionId=${sessionId ?? "none"}`);

    const q = query({
      prompt,
      options: {
        cwd: workspacePath,
        model: getModel(),
        permissionMode: "bypassPermissions",
        executable: nodeBin as any,
        pathToClaudeCodeExecutable: cliJsPath,
        env,
        stderr: (data: string) => {
          debugLog(`SDK stderr: ${data.trim()}`);
          console.error("[Claude SDK]", data);
        },
        ...(sessionId ? { resume: sessionId } : {}),
        abortController,
      } as any,
    });

    let msgCount = 0;
    for await (const message of q) {
      if (abortController.signal.aborted) break;

      const msgType = (message as any).type;
      msgCount++;
      debugLog(`msg #${msgCount} type=${msgType}`);

      if (msgType === "stream_event") {
        const event = (message as any).event;

        if (
          event?.type === "content_block_delta" &&
          event?.delta?.type === "text_delta"
        ) {
          const token: string = event.delta.text;
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
        const content = (message as any).message?.content ?? [];
        const textBlock = content.find(
          (b: { type: string }) => b.type === "text"
        );
        if (textBlock?.text) {
          assembledText = textBlock.text;
          win.webContents.send(STREAM.ASSISTANT_COMPLETE, assembledText);
        }
      }

      if (msgType === "result") {
        finalSessionId = (message as any).session_id ?? finalSessionId;
        doneSent = true;
        win.webContents.send(STREAM.DONE, { sessionId: finalSessionId });
      }
    }

    debugLog(`for-loop exited: msgCount=${msgCount} doneSent=${doneSent}`);

    // Failsafe: if the loop completed without a "result" message, send DONE anyway
    // so isStreaming resets in the UI.
    if (!doneSent && !abortController.signal.aborted) {
      debugLog(`sending DONE failsafe`);
      if (assembledText) {
        win.webContents.send(STREAM.ASSISTANT_COMPLETE, assembledText);
      }
      win.webContents.send(STREAM.DONE, { sessionId: finalSessionId });
    }
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      const errMsg = err?.message ?? "Unknown error";
      debugLog(`runQuery error: ${errMsg}`);
      win.webContents.send(STREAM.ERROR, errMsg);
    }
  } finally {
    if (currentAbortController === abortController) {
      currentAbortController = null;
    }
  }

  return finalSessionId;
}
