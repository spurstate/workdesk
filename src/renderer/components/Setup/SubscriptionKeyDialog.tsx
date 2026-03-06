import React, { useState, useEffect } from "react";

const SUPPORT_URL = "https://TODO";

interface Props {
  storedKey?: string;
  onValidated: () => void;
}

export default function SubscriptionKeyDialog({ storedKey: initialStoredKey, onValidated }: Props) {
  const [key, setKey] = useState(initialStoredKey ?? "");
  const [hasStoredKey, setHasStoredKey] = useState(!!initialStoredKey);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setKey(initialStoredKey ?? "");
    setHasStoredKey(!!initialStoredKey);
  }, [initialStoredKey]);

  const handleSubmit = async () => {
    if (!key.trim()) return;
    setValidating(true);
    setError("");
    try {
      const result = await window.api.subscriptionKey.validate(key.trim());
      if (result.valid) {
        onValidated();
      } else {
        setError(result.message);
      }
    } catch {
      setError("Could not reach the server. Please check your connection.");
    } finally {
      setValidating(false);
    }
  };

  const handleUseDifferentKey = async () => {
    await window.api.subscriptionKey.clear();
    setKey("");
    setError("");
    setHasStoredKey(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Enter your Subscription Key
        </h2>
        <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
          A subscription key is required to use Spurstate Workdesk.
        </p>

        <input
          type="text"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError("");
          }}
          placeholder="Your subscription key"
          autoFocus
          className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500 mb-2"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {error && (
          <div className="mb-4">
            <p className="text-red-400 text-xs">{error}</p>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Contact support
            </a>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={!key.trim() || validating}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {validating ? "Validating…" : "Activate"}
          </button>

          {hasStoredKey && (
            <button
              onClick={handleUseDifferentKey}
              className="w-full py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-lg transition-colors"
            >
              Use a different key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
