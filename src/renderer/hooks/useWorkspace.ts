import { useState, useEffect, useCallback } from "react";
import type { WorkspaceFile } from "../../shared/types";

export function useWorkspace() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.workspace.getCurrent().then((path) => {
      setWorkspacePath(path);
      if (path) {
        window.api.workspace.listFiles().then(setFiles);
      }
      setLoading(false);
    });

    const unsubscribe = window.api.workspace.onFilesChanged((updated) => {
      setFiles(updated);
    });

    return unsubscribe;
  }, []);

  const selectWorkspace = useCallback(async (): Promise<string | null> => {
    const path = await window.api.workspace.select();
    if (path) {
      setWorkspacePath(path);
      const newFiles = await window.api.workspace.listFiles();
      setFiles(newFiles);
    }
    return path;
  }, []);

  return { workspacePath, files, loading, selectWorkspace };
}
