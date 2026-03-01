import React, { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
}

export default function ChatInput({ onSend, onAbort, isStreaming }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!isStreaming) sendingRef.current = false;
  }, [isStreaming]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || sendingRef.current) return;
    sendingRef.current = true;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
  };

  return (
    <div className="flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
        placeholder="Ask Claude anything… (Enter to send, Shift+Enter for newline)"
        rows={1}
        data-testid="chat-input"
        className="flex-1 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50 leading-relaxed"
      />
      {isStreaming ? (
        <button
          onClick={onAbort}
          data-testid="chat-stop"
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          data-testid="chat-send"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
        >
          Send
        </button>
      )}
    </div>
  );
}
