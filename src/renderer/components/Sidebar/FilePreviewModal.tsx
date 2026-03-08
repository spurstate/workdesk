import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, X } from "lucide-react";

interface Props {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

export default function FilePreviewModal({ filePath, fileName, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    setContent(null);
    setError(null);
    window.api.workspace.readFile(filePath)
      .then(setContent)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to read file'));
  }, [filePath]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
      onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (e.target === e.currentTarget && mouseDownOnBackdrop.current) onClose(); }}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col"
        style={{ width: 768, height: '80vh', minWidth: 320, minHeight: 200, resize: 'both', overflow: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <span className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
            {fileName}
          </span>
          <button
            onClick={() => window.api.files.export([filePath])}
            className="ml-auto flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
            title="Save to computer"
          >
            <Download size={13} />
            Save
          </button>
          <button
            onClick={onClose}
            className="ml-2 flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {content === null && !error && (
            <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>
          )}
          {error && (
            <p className="text-sm text-red-500">Could not read file: {error}</p>
          )}
          {content !== null && (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
