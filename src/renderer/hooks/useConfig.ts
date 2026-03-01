import { useState, useEffect, useCallback } from "react";

export function useConfig() {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.config.getKeyStatus().then((status) => {
      setHasKey(status);
      setLoading(false);
    });
  }, []);

  const setKey = useCallback(async (key: string) => {
    await window.api.config.setKey(key);
    setHasKey(true);
  }, []);

  const clearKey = useCallback(async () => {
    await window.api.config.clearKey();
    setHasKey(false);
  }, []);

  return { hasKey, loading, setKey, clearKey };
}
