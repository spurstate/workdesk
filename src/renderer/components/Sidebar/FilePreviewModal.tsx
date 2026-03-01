import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";

interface Props {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

export default function FilePreviewModal({ filePath, fileName, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(null);
    setError(null);
    window.api.workspace.readFile(filePath)
      .then(setContent)
      .catch((e: Error) => setError(e.message));
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <span className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
            {fileName}
          </span>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
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
