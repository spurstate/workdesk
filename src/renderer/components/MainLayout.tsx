import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import logoSrc from "../assets/logo.png";
import { useChat } from "../hooks/useChat";
import { useSessions } from "../hooks/useSessions";
import { useTheme } from "../hooks/useTheme";
import type { WorkspaceFile } from "../../shared/types";
import ChatView from "./Chat/ChatView";
import CommandPanel from "./Commands/CommandPanel";
import FileBrowser from "./Sidebar/FileBrowser";
import FilePreviewModal from "./Sidebar/FilePreviewModal";
import SessionList from "./Sidebar/SessionList";

interface Props {
  workspacePath: string;
  onOpenSettings: () => void;
  onUpdateContext: () => void;
}

type SidebarTab = "files" | "sessions";

export default function MainLayout({ workspacePath: _workspacePath, onOpenSettings, onUpdateContext }: Props) {
  const chat = useChat();
  const { sessions, loading: sessionsLoading, error: sessionsError, refresh: refreshSessions } = useSessions();
  const { theme, toggleTheme } = useTheme();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("files");
  const [showCommands, setShowCommands] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string } | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [contextFiles, setContextFiles] = useState<WorkspaceFile[]>([]);
  const [outputFiles, setOutputFiles] = useState<WorkspaceFile[]>([]);

  useEffect(() => {
    window.api.config.getOutputPath().then(setOutputPath);
  }, []);

  // Load context files on mount; re-fetch when wizard writes context files
  useEffect(() => {
    const fetchContext = () => window.api.workspace.listContextFiles().then(setContextFiles);
    fetchContext();
    return window.api.workspace.onContextChanged(fetchContext);
  }, []);

  // Re-fetch output files when outputPath changes (new folder selected)
  useEffect(() => {
    if (outputPath) window.api.output.listFiles().then(setOutputFiles);
  }, [outputPath]);

  // Subscribe to live output folder changes (files written by Claude)
  useEffect(() => {
    return window.api.output.onFilesChanged(setOutputFiles);
  }, []);

  const handleSendMessage = async (message: string) => {
    await chat.sendMessage(message);
  };

  const handleCommandSubmit = async (prompt: string, label?: string) => {
    setShowCommands(false);
    await chat.sendMessage(prompt, label);
  };

  const handleResumeSession = (sessionId: string) => {
    setSidebarTab("files");
    chat.resumeSession(sessionId);
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
              {/* Output Folder section */}
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Output Folder
              </p>
              {outputPath ? (
                <FileBrowser
                  files={outputFiles}
                  onOpenFile={(path, name) => setPreviewFile({ path, name })}
                />
              ) : (
                <p className="px-3 pb-2 text-xs text-gray-400 dark:text-slate-500">
                  No output folder selected
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-slate-700 mx-3 my-2" />

              {/* Workspace section */}
              <p className="px-3 pb-1 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Workspace
              </p>
              <FileBrowser
                files={contextFiles}
                onOpenFile={(path, name) => setPreviewFile({ path, name })}
              />
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
            onClick={onUpdateContext}
            data-testid="update-context-btn"
            className="w-full text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 py-1 text-left"
          >
            ✏ Update Context
          </button>
          <button
            onClick={async () => {
              const selected = await window.api.output.selectFolder();
              if (selected) setOutputPath(selected);
            }}
            data-testid="output-folder-btn"
            className="w-full text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 py-1 text-left"
          >
            📁 Output Folder
            {outputPath && (
              <span className="block text-[10px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                {outputPath.split("/").pop()}
              </span>
            )}
          </button>
          <button
            onClick={onOpenSettings}
            data-testid="settings-btn"
            className="w-full text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 py-1 text-left"
          >
            ⚙ Settings
          </button>
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
            {showCommands ? "✕ Close Commands" : "⚡ Commands"}
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
    </div>
  );
}
