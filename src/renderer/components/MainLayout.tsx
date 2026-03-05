import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import logoSrc from "../assets/logo.png";
import { useChat } from "../hooks/useChat";
import { useSessions } from "../hooks/useSessions";
import { useTheme } from "../hooks/useTheme";
import type { WorkspaceFile, ChatMessage } from "../../shared/types";
import ChatView from "./Chat/ChatView";
import CommandPanel from "./Commands/CommandPanel";
import FileBrowser from "./Sidebar/FileBrowser";
import FilePreviewModal from "./Sidebar/FilePreviewModal";
import SessionList from "./Sidebar/SessionList";
import ManageFilesModal from "./Files/ManageFilesModal";
import HowToUseModal from "./HowToUseModal";

interface Props {
  workspacePath: string;
  onOpenSettings: () => void;
  onUpdateContext: () => void;
}

type SidebarTab = "files" | "sessions";

function flattenFiles(files: WorkspaceFile[]): string[] {
  const paths: string[] = [];
  for (const f of files) {
    if (f.isDirectory && f.children) {
      paths.push(...flattenFiles(f.children));
    } else if (!f.isDirectory) {
      paths.push(f.path);
    }
  }
  return paths;
}

export default function MainLayout({ workspacePath, onOpenSettings, onUpdateContext }: Props) {
  const chat = useChat();
  const { sessions, loading: sessionsLoading, error: sessionsError, refresh: refreshSessions } = useSessions();
  const { theme, toggleTheme } = useTheme();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("files");
  const [showCommands, setShowCommands] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string } | null>(null);
  const [outputFiles, setOutputFiles] = useState<WorkspaceFile[]>([]);
  const [showManageFiles, setShowManageFiles] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Load generated resources on mount and on live changes
  useEffect(() => {
    window.api.output.listFiles().then(setOutputFiles);
    return window.api.output.onFilesChanged(setOutputFiles);
  }, []);

  const handleSendMessage = async (message: string) => {
    await chat.sendMessage(message);
  };

  const handleCommandSubmit = async (prompt: string, label?: string) => {
    setShowCommands(false);
    await chat.sendMessage(prompt, label);
  };

  const handleResumeSession = async (sessionId: string) => {
    const raw = await window.api.session.loadMessages(sessionId);
    const messages: ChatMessage[] = raw.map((m, i) => ({
      id: `resumed-${i}`,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: 0,
    }));
    setSidebarTab("files");
    chat.resumeSession(sessionId, messages);
  };

  const handleExportOutputs = async () => {
    const paths = flattenFiles(outputFiles);
    if (paths.length === 0) return;
    await window.api.files.export(paths);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {/* App header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="min-w-0">
            <img src={logoSrc} alt="Spurstate" className="h-6 w-auto dark:brightness-[1.8]" />
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mt-1 tracking-widest uppercase">Workdesk</p>
          </div>
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className="ml-2 flex-shrink-0 p-1.5 rounded-md text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Sidebar tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setSidebarTab("files")}
            data-testid="sidebar-files-tab"
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              sidebarTab === "files"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            Files
          </button>
          <button
            onClick={() => {
              setSidebarTab("sessions");
              refreshSessions();
            }}
            data-testid="sidebar-sessions-tab"
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              sidebarTab === "sessions"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            Sessions
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto">
          {sidebarTab === "files" ? (
            <div>
              {/* Generated Resources section header */}
              <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Generated Resources
                </p>
                {outputFiles.length > 0 && (
                  <button
                    onClick={handleExportOutputs}
                    title="Export all generated resources"
                    className="text-[10px] text-gray-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    Export ↓
                  </button>
                )}
              </div>
              {outputFiles.length > 0 ? (
                <FileBrowser
                  files={outputFiles}
                  onOpenFile={(path, name) => setPreviewFile({ path, name })}
                />
              ) : (
                <p className="px-3 pb-2 text-xs text-gray-400 dark:text-slate-500">
                  No files yet — run a command to generate resources
                </p>
              )}
            </div>
          ) : (
            <SessionList
              sessions={sessions}
              loading={sessionsLoading}
              error={sessionsError}
              onResume={handleResumeSession}
            />
          )}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-700 space-y-1">
          <button
            onClick={() => setShowHowToUse(true)}
            className="w-full text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 py-1 text-left"
          >
            📖 How to Use
          </button>
          <button
            onClick={onUpdateContext}
            data-testid="update-context-btn"
            className="w-full text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 py-1 text-left"
          >
            ✏ Update Context
          </button>
          <button
            onClick={() => setShowManageFiles(true)}
            data-testid="manage-files-btn"
            className="w-full text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 py-1 text-left"
          >
            🗂 Manage Files
          </button>
          <button
            onClick={onOpenSettings}
            data-testid="settings-btn"
            className="w-full text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 py-1 text-left"
          >
            ⚙ Settings
          </button>
          <p className="text-[10px] text-gray-300 dark:text-slate-600 text-center pt-1">Powered by Anthropic</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Command panel toggle */}
        <div className="border-b border-gray-200 dark:border-slate-700 px-4 py-2">
          <button
            onClick={() => setShowCommands(!showCommands)}
            data-testid="cmd-toggle"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
          >
            {showCommands ? "✕ Close Tasks" : "⚡ Tasks"}
          </button>
          {chat.currentSessionId && (
            <span className="ml-3 text-xs text-gray-400 dark:text-slate-500">
              Session active
            </span>
          )}
        </div>

        {/* Command panel (collapsible) */}
        {showCommands && (
          <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <CommandPanel onSubmit={handleCommandSubmit} />
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <ChatView
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            streamingText={chat.streamingText}
            activeTool={chat.activeTool}
            error={chat.error}
            onSend={handleSendMessage}
            onAbort={chat.abort}
          />
        </div>
      </div>

      {previewFile && (
        <FilePreviewModal
          filePath={previewFile.path}
          fileName={previewFile.name}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {showManageFiles && (
        <ManageFilesModal
          workspacePath={workspacePath}
          onClose={() => setShowManageFiles(false)}
        />
      )}

      {showHowToUse && (
        <HowToUseModal onClose={() => setShowHowToUse(false)} />
      )}
    </div>
  );
}
