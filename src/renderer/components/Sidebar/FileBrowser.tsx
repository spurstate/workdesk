import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Download,
  Trash2,
  Folder,
  FolderOpen,
  FileText,
  File,
  Presentation,
  Braces,
  FileCode,
  BookOpen,
  Image,
} from "lucide-react";
import type { WorkspaceFile } from "../../../shared/types";

interface Props {
  files: WorkspaceFile[];
  onOpenFile: (path: string, name: string) => void;
  onDeleteFile: (path: string) => void;
}

export default function FileBrowser({ files, onOpenFile, onDeleteFile }: Props) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const seenDirPaths = useRef<Set<string>>(new Set());

  // Auto-expand directories the first time they appear (new dirs from watcher updates)
  useEffect(() => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      const collectDirs = (list: WorkspaceFile[]) => {
        for (const f of list) {
          if (f.isDirectory && !seenDirPaths.current.has(f.path)) {
            next.add(f.path);
            seenDirPaths.current.add(f.path);
            if (f.children) collectDirs(f.children);
          }
        }
      };
      collectDirs(files);
      return next;
    });
  }, [files]);

  const toggleExpanded = (filePath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  if (files.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-500">No files yet</div>
    );
  }
  return (
    <div className="p-2">
      {files.map((file) => (
        <FileNode
          key={file.path}
          file={file}
          depth={0}
          onOpenFile={onOpenFile}
          onDeleteFile={onDeleteFile}
          expandedPaths={expandedPaths}
          onToggleExpanded={toggleExpanded}
        />
      ))}
    </div>
  );
}

function FileNode({
  file,
  depth,
  onOpenFile,
  onDeleteFile,
  expandedPaths,
  onToggleExpanded,
}: {
  file: WorkspaceFile;
  depth: number;
  onOpenFile: (path: string, name: string) => void;
  onDeleteFile: (path: string) => void;
  expandedPaths: Set<string>;
  onToggleExpanded: (filePath: string) => void;
}) {
  const expanded = expandedPaths.has(file.path);
  const isMarkdown = !file.isDirectory && file.name.endsWith(".md");
  const isInteractive = file.isDirectory || isMarkdown;

  const innerContent = (
    <>
      {/* Chevron for directories */}
      <span className="w-3 flex-shrink-0 flex items-center justify-center">
        {file.isDirectory ? (
          expanded ? (
            <ChevronDown size={11} className="text-slate-500" />
          ) : (
            <ChevronRight size={11} className="text-slate-500" />
          )
        ) : null}
      </span>

      {/* File / folder icon */}
      <span className="flex-shrink-0 flex items-center">
        {file.isDirectory ? (
          expanded ? (
            <FolderOpen size={13} className="text-amber-400" />
          ) : (
            <Folder size={13} className="text-amber-400" />
          )
        ) : (
          <FileIcon name={file.name} />
        )}
      </span>

      <span className="truncate">{file.name}</span>
    </>
  );

  const baseClass = "flex items-center gap-1.5 w-full text-left px-2 py-1 rounded text-xs transition-colors";
  const indentStyle = { paddingLeft: `${depth * 12 + 8}px` };

  return (
    <div>
      <div className="group relative">
        {isInteractive ? (
          <button
            onClick={() => {
              if (file.isDirectory) onToggleExpanded(file.path);
              else onOpenFile(file.path, file.name);
            }}
            className={`${baseClass} ${
              file.isDirectory
                ? "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                : "text-gray-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 pr-6"
            }`}
            style={indentStyle}
          >
            {innerContent}
          </button>
        ) : (
          <div
            className={`${baseClass} text-gray-400 dark:text-slate-500 pr-6`}
            style={indentStyle}
          >
            {innerContent}
          </div>
        )}
        {!file.isDirectory && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.api.files.export([file.path]);
              }}
              className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              title="Save to computer"
            >
              <Download size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${file.name}"? This cannot be undone.`)) {
                  onDeleteFile(file.path);
                }
              }}
              className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              title="Delete file"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {file.isDirectory && expanded && file.children?.map((child) => (
        <FileNode
          key={child.path}
          file={child}
          depth={depth + 1}
          onOpenFile={onOpenFile}
          onDeleteFile={onDeleteFile}
          expandedPaths={expandedPaths}
          onToggleExpanded={onToggleExpanded}
        />
      ))}
    </div>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "md")   return <FileText   size={13} className="text-blue-400" />;
  if (ext === "pptx") return <Presentation size={13} className="text-orange-400" />;
  if (ext === "docx") return <FileText   size={13} className="text-sky-400" />;
  if (ext === "pdf")  return <BookOpen   size={13} className="text-red-400" />;
  if (ext === "json") return <Braces     size={13} className="text-yellow-400" />;
  if (ext === "ts" || ext === "tsx") return <FileCode size={13} className="text-blue-300" />;
  if (ext === "js" || ext === "jsx") return <FileCode size={13} className="text-yellow-300" />;
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext))
    return <Image size={13} className="text-green-400" />;

  return <File size={13} className="text-slate-500" />;
}
