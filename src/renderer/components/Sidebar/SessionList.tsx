import React from "react";
import type { SessionInfo } from "../../../shared/types";

interface Props {
  sessions: SessionInfo[];
  loading: boolean;
  error: string;
  onResume: (sessionId: string) => void;
}

export default function SessionList({ sessions, loading, error, onResume }: Props) {
  if (loading) {
    return (
      <div className="p-4 text-xs text-gray-400 dark:text-slate-500">
        Loading sessions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-xs text-red-400">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-xs text-gray-400 dark:text-slate-500">
        No past sessions yet
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onResume(session.id)}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
        >
          <div className="text-xs text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white truncate">
            {session.preview || "Session"}
          </div>
          <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            {formatDate(session.timestamp)}
          </div>
        </button>
      ))}
    </div>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
