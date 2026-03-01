import { useState, useCallback } from "react";
import type { SessionInfo } from "../../shared/types";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await window.api.session.list();
      setSessions(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  return { sessions, loading, error, refresh };
}
