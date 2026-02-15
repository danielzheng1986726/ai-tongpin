"use client";

import { createContext, useState, useCallback, type ReactNode } from "react";

export interface AIConversationState {
  currentSpeaker: string | null;
  currentMessage: string | null;
  topic: string | null;
  speakerA: string | null;
  speakerB: string | null;
  recentMessages: { speaker: string; text: string }[];
}

interface AIConversationContextType extends AIConversationState {
  broadcast: (speaker: string, message: string) => void;
  setTopicInfo: (topic: string, speakerA: string, speakerB: string) => void;
  clearConversation: () => void;
}

export const AIConversationContext = createContext<AIConversationContextType>({
  currentSpeaker: null,
  currentMessage: null,
  topic: null,
  speakerA: null,
  speakerB: null,
  recentMessages: [],
  broadcast: () => {},
  setTopicInfo: () => {},
  clearConversation: () => {},
});

export function AIConversationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIConversationState>({
    currentSpeaker: null,
    currentMessage: null,
    topic: null,
    speakerA: null,
    speakerB: null,
    recentMessages: [],
  });

  const broadcast = useCallback((speaker: string, message: string) => {
    setState((prev) => ({
      ...prev,
      currentSpeaker: speaker,
      currentMessage: message,
      recentMessages: [...prev.recentMessages, { speaker, text: message }].slice(-20),
    }));
  }, []);

  const setTopicInfo = useCallback((topic: string, speakerA: string, speakerB: string) => {
    setState((prev) => ({
      ...prev,
      topic,
      speakerA,
      speakerB,
      recentMessages: [],
    }));
  }, []);

  const clearConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSpeaker: null,
      currentMessage: null,
    }));
  }, []);

  return (
    <AIConversationContext.Provider value={{ ...state, broadcast, setTopicInfo, clearConversation }}>
      {children}
    </AIConversationContext.Provider>
  );
}
