import React from "react";
import type { ChatMessage } from "../../../shared/types";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
