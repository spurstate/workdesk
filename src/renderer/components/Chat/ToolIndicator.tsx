import React from "react";

interface Props {
  toolName: string;
}

const TOOL_LABELS: Record<string, string> = {
  Read: "Reading files…",
  Write: "Writing document…",
  Edit: "Editing file…",
  Glob: "Scanning workspace…",
  Grep: "Searching files…",
  WebSearch: "Searching the web…",
  WebFetch: "Fetching page…",
};

export default function ToolIndicator({ toolName }: Props) {
  const label = TOOL_LABELS[toolName] ?? `Using ${toolName}…`;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 ml-10">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}
