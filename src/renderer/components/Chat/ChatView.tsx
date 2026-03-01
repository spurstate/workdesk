import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../../shared/types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ToolIndicator from "./ToolIndicator";

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 — Fast & efficient" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — Balanced" },
  { id: "claude-opus-4-6", label: "Opus 4.6 — Most capable" },
];

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  activeTool: string | null;
  error: string | null;
  onSend: (message: string) => void;
  onAbort: () => void;
}

export default function ChatView({
  messages,
  isStreaming,
  streamingText,
  activeTool,
  error,
  onSend,
  onAbort,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [model, setModelState] = useState("claude-haiku-4-5-20251001");

  useEffect(() => {
    window.api.config.getModel().then(setModelState);
  }, []);

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setModelState(value);
    window.api.config.setModel(value);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header — model selector */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xs text-gray-500 dark:text-slate-400">Model</span>
        <select
          value={model}
          onChange={handleModelChange}
          disabled={isStreaming}
          className="text-xs bg-transparent border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">
              Type a message or use a Command button to get started
            </p>
          </div>
        )}

        <MessageList messages={messages} />

        {/* Streaming text */}
        {isStreaming && streamingText && (
          <div className="mb-3">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs flex-shrink-0">
                🤖
              </div>
              <div className="bg-gray-100 dark:bg-slate-800 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <StreamingTextInline text={streamingText} />
              </div>
            </div>
          </div>
        )}

        {/* Tool indicator */}
        {activeTool && <ToolIndicator toolName={activeTool} />}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-300 mb-3">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 px-4 py-3">
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 mb-2">
            <span className="flex gap-0.5 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
            <span>{getStreamingStatus(activeTool, streamingText)}</span>
          </div>
        )}
        <ChatInput
          onSend={onSend}
          onAbort={onAbort}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}

function getStreamingStatus(activeTool: string | null, streamingText: string): string {
  if (activeTool) {
    const labels: Record<string, string> = {
      Read: "Reading files…",
      Write: "Writing document…",
      Edit: "Editing file…",
      Glob: "Scanning workspace…",
      Grep: "Searching files…",
      WebSearch: "Searching the web…",
      WebFetch: "Fetching page…",
    };
    return labels[activeTool] ?? `Using ${activeTool}…`;
  }
  return streamingText ? "Claude is responding…" : "Claude is thinking…";
}

function StreamingTextInline({ text }: { text: string }) {
  return (
    <div className="prose dark:prose-invert prose-sm max-w-none text-gray-800 dark:text-slate-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
    </div>
  );
}
