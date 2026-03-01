import React, { useState } from "react";

interface Props {
  onSave: (key: string) => Promise<void>;
  onClose?: () => void;
  required?: boolean;
}

export default function ApiKeyDialog({ onSave, onClose, required }: Props) {
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!key.trim().startsWith("sk-ant-")) {
      setError("API key should start with sk-ant-");
      return;
    }
    setSaving(true);
    try {
      await onSave(key.trim());
    } catch (e: any) {
      setError(e?.message ?? "Failed to save key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {required ? "Welcome! Enter your API Key" : "Update API Key"}
        </h2>
        <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
          Spurstate Workdesk uses the Anthropic API to power Claude.{" "}
          <span className="text-gray-500 dark:text-slate-500">
            Your key is encrypted and stored securely on this device.
          </span>
        </p>

        <input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError("");
          }}
          placeholder="sk-ant-api03-..."
          autoFocus
          data-testid="api-key-input"
          className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500 mb-2"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />

        {error && (
          <p className="text-red-400 text-xs mb-4">{error}</p>
        )}

        <div className="flex gap-3 mt-4">
          {onClose && !required && (
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!key.trim() || saving}
            data-testid="save-key-btn"
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save Key"}
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-slate-600 mt-4 text-center">
          Get your key at console.anthropic.com
        </p>
      </div>
    </div>
  );
}
