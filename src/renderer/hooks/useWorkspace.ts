import { useState, useEffect } from "react";
import type { WorkspaceFile } from "../../shared/types";

export function useWorkspace() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);

  useEffect(() => {
    window.api.workspace.getCurrent().then((path) => {
      setWorkspacePath(path);
      window.api.workspace.listFiles().then(setFiles);
    });

    const unsubscribe = window.api.workspace.onFilesChanged((updated) => {
      setFiles(updated);
    });

    return unsubscribe;
  }, []);

  return { workspacePath, files };
}
