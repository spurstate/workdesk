import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Upload, Trash2, Download } from "lucide-react";
import type { WorkspaceFile } from "../../../shared/types";

interface Props {
  workspacePath: string;
  onClose: () => void;
}

type Tab = "context" | "curriculum";

export default function ManageFilesModal({ workspacePath: _workspacePath, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("context");
  const [contextFiles, setContextFiles] = useState<WorkspaceFile[]>([]);
  const [curriculumFiles, setCurriculumFiles] = useState<WorkspaceFile[]>([]);
  const [previewContent, setPreviewContent] = useState<{ name: string; content: string } | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadContextFiles();
    loadCurriculumFiles();
  }, []);

  const loadContextFiles = () =>
    window.api.workspace.listContextFiles().then((files) => {
      // Flatten: pull children from the context/ directory entry
      const flat: WorkspaceFile[] = [];
      for (const f of files) {
        if (f.isDirectory && f.children) flat.push(...f.children);
        else if (!f.isDirectory) flat.push(f);
      }
      setContextFiles(flat);
    });

  const loadCurriculumFiles = () =>
    window.api.curriculum.listFiles().then(setCurriculumFiles);

  const handlePreview = async (file: WorkspaceFile) => {
    try {
      const content = await window.api.workspace.readFile(file.path);
      setPreviewContent({ name: file.name, content });
    } catch {
      // ignore preview errors
    }
  };

  const handleExportContext = async () => {
    const paths = contextFiles.map((f) => f.path);
    if (paths.length === 0) return;
    await window.api.files.export(paths);
  };

  const handleImportCurriculum = async () => {
    setImporting(true);
    try {
      await window.api.curriculum.importFile();
      await loadCurriculumFiles();
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteCurriculum = async (file: WorkspaceFile) => {
    await window.api.curriculum.deleteFile(file.path);
    await loadCurriculumFiles();
  };

  const handleExportCurriculum = async () => {
    const paths = curriculumFiles.map((f) => f.path);
    if (paths.length === 0) return;
    await window.api.files.export(paths);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl text-gray-900 dark:text-white flex flex-col"
        style={{ width: 520, height: '70vh', minWidth: 360, minHeight: 300, resize: 'both', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-base font-semibold">Manage Files</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {(["context", "curriculum"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPreviewContent(null); }}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${
                tab === t
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              {t === "context" ? "Context Files" : "Curriculum"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {previewContent ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setPreviewContent(null)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  ← Back
                </button>
                <span className="text-sm font-medium">{previewContent.name}</span>
              </div>
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent.content}</ReactMarkdown>
              </div>
            </div>
          ) : tab === "context" ? (
            <div className="p-4">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                Your teaching context — used to personalise every AI response.
              </p>
              {contextFiles.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">No context files found.</p>
              ) : (
                <ul className="space-y-1">
                  {contextFiles.map((f) => (
                    <li key={f.path}>
                      <button
                        onClick={() => handlePreview(f)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                      >
                        <span className="text-gray-400">📄</span>
                        {f.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                Reference files Claude uses when generating resources. Import your own curriculum documents to tailor the output.
              </p>
              {curriculumFiles.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">No curriculum files found.</p>
              ) : (
                <ul className="space-y-1">
                  {curriculumFiles.map((f) => (
                    <li key={f.path} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 group transition-colors">
                      <span className="text-gray-400 text-xs">📄</span>
                      <button
                        onClick={() => handlePreview(f)}
                        className="flex-1 text-left text-xs text-gray-700 dark:text-slate-300"
                      >
                        {f.name}
                      </button>
                      <button
                        onClick={() => handleDeleteCurriculum(f)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!previewContent && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex gap-2">
            {tab === "context" ? (
              <button
                onClick={handleExportContext}
                disabled={contextFiles.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <Download size={12} />
                Export Context Files
              </button>
            ) : (
              <>
                <button
                  onClick={handleImportCurriculum}
                  disabled={importing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Upload size={12} />
                  {importing ? "Importing..." : "Import File"}
                </button>
                <button
                  onClick={handleExportCurriculum}
                  disabled={curriculumFiles.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <Download size={12} />
                  Export All
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
