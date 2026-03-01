import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../../shared/types";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
          isUser ? "bg-slate-600" : "bg-blue-600"
        }`}
      >
        {isUser ? "👤" : "🤖"}
      </div>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
