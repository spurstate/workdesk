import { useReducer, useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "../../shared/types";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  activeTool: string | null;
  currentSessionId: string | undefined;
  error: string | null;
}

type ChatAction =
  | { type: "USER_MESSAGE"; payload: string }
  | { type: "TOKEN"; payload: string }
  | { type: "TOOL_START"; payload: string }
  | { type: "TOOL_END" }
  | { type: "ASSISTANT_COMPLETE"; payload: string }
  | { type: "DONE"; payload: string }
  | { type: "ERROR"; payload: string }
  | { type: "ABORT" }
  | { type: "CLEAR" }
  | { type: "RESUME"; payload: { sessionId: string; messages: ChatMessage[] } };

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "USER_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: createId(),
            role: "user",
            content: action.payload,
            timestamp: Date.now(),
          },
        ],
        isStreaming: true,
        streamingText: "",
        activeTool: null,
        error: null,
      };

    case "TOKEN":
      return {
        ...state,
        streamingText: state.streamingText + action.payload,
      };

    case "TOOL_START":
      return { ...state, activeTool: action.payload };

    case "TOOL_END":
      return { ...state, activeTool: null };

    case "ASSISTANT_COMPLETE": {
      // Replace any partial streaming message and finalize
      const finalMessages = state.messages.filter((m) => !m.isStreaming);
      return {
        ...state,
        messages: [
          ...finalMessages,
          {
            id: createId(),
            role: "assistant",
            content: action.payload,
            timestamp: Date.now(),
          },
        ],
        streamingText: "",
        activeTool: null,
      };
    }

    case "DONE":
      return {
        ...state,
        isStreaming: false,
        streamingText: "",
        activeTool: null,
        currentSessionId: action.payload || state.currentSessionId,
      };

    case "ERROR":
      return {
        ...state,
        isStreaming: false,
        streamingText: "",
        activeTool: null,
        error: action.payload,
      };

    case "ABORT":
      return {
        ...state,
        isStreaming: false,
        streamingText: "",
        activeTool: null,
      };

    case "CLEAR":
      return {
        messages: [],
        isStreaming: false,
        streamingText: "",
        activeTool: null,
        currentSessionId: undefined,
        error: null,
      };

    case "RESUME":
      return {
        messages: action.payload.messages,
        isStreaming: false,
        streamingText: "",
        activeTool: null,
        currentSessionId: action.payload.sessionId,
        error: null,
      };

    default:
      return state;
  }
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  streamingText: "",
  activeTool: null,
  currentSessionId: undefined,
  error: null,
};

export function useChat() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubscribers = useRef<Array<() => void>>([]);

  useEffect(() => {
    const subs = [
      window.api.chat.onToken((token) =>
        dispatch({ type: "TOKEN", payload: token })
      ),
      window.api.chat.onToolStart((name) =>
        dispatch({ type: "TOOL_START", payload: name })
      ),
      window.api.chat.onToolEnd(() => dispatch({ type: "TOOL_END" })),
      window.api.chat.onAssistantComplete((text) =>
        dispatch({ type: "ASSISTANT_COMPLETE", payload: text })
      ),
      window.api.chat.onError((err) =>
        dispatch({ type: "ERROR", payload: err })
      ),
      window.api.chat.onDone((data) =>
        dispatch({ type: "DONE", payload: data.sessionId })
      ),
    ];
    unsubscribers.current = subs;
    return () => subs.forEach((u) => u());
  }, []);

  const sendMessage = useCallback(
    async (message: string, displayText?: string) => {
      dispatch({ type: "USER_MESSAGE", payload: displayText ?? message });
      try {
        await window.api.chat.send(message, state.currentSessionId);
      } catch (err: any) {
        dispatch({ type: "ERROR", payload: err?.message ?? "Failed to send message" });
      }
    },
    [state.currentSessionId]
  );

  const abort = useCallback(() => {
    window.api.chat.abort();
    dispatch({ type: "ABORT" });
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const resumeSession = useCallback((sessionId: string, messages: ChatMessage[]) => {
    dispatch({ type: "RESUME", payload: { sessionId, messages } });
  }, []);

  return { ...state, sendMessage, abort, clearChat, resumeSession };
}
