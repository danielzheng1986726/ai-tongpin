"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { AIConversationContext } from "@/contexts/AIConversationContext";

interface Highlight {
  id: string;
  content: string;
  topic: string;
  speakerA: string;
  speakerB: string;
}

export default function AIHighlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const lastExtractTime = useRef<number>(0);
  const { topic, speakerA, speakerB, recentMessages } = useContext(AIConversationContext);
  const prevTopicRef = useRef<string | null>(null);

  // Extract highlight when topic changes (meaning previous conversation ended)
  useEffect(() => {
    if (!topic || !speakerA || !speakerB) return;

    // Topic changed — extract highlight from previous conversation
    if (prevTopicRef.current && prevTopicRef.current !== topic && recentMessages.length === 0) {
      // Previous conversation just ended, but messages are cleared. Skip.
    }
    prevTopicRef.current = topic;
  }, [topic, speakerA, speakerB, recentMessages]);

  // Periodically extract highlights (every 60s if there are enough messages)
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      if (now - lastExtractTime.current < 60000) return;
      if (recentMessages.length < 3) return;
      if (!topic || !speakerA || !speakerB) return;

      lastExtractTime.current = now;

      const conversationText = recentMessages
        .map((m) => `${m.speaker}: ${m.text}`)
        .join("\n");

      try {
        const res = await fetch("/api/highlights/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            conversation: conversationText,
            speakerA,
            speakerB,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.highlight) {
            setHighlights((prev) => [...prev.slice(-9), data.highlight]);
          }
        }
      } catch {
        // silently fail
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [topic, speakerA, speakerB, recentMessages]);

  // Also load recent highlights from DB on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/highlights?limit=10");
        if (res.ok) {
          const data = await res.json();
          if (data.highlights?.length > 0) {
            setHighlights(data.highlights);
          }
        }
      } catch {
        // silently fail
      }
    })();
  }, []);

  // Cycle through highlights every 15 seconds
  useEffect(() => {
    if (highlights.length === 0) return;

    setVisible(true);
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % highlights.length);
        setVisible(true);
      }, 500);
    }, 15000);

    return () => clearInterval(timer);
  }, [highlights.length]);

  if (highlights.length === 0) return null;

  const current = highlights[currentIndex % highlights.length];
  if (!current) return null;

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-20
        bg-gradient-to-r from-purple-600/80 to-teal-500/80
        backdrop-blur-sm rounded-2xl px-5 py-2.5 max-w-[85%]
        text-white text-xs font-medium text-center
        shadow-lg shadow-purple-500/20
        transition-opacity duration-500
        ${visible ? "opacity-100" : "opacity-0"}
      `}
    >
      <span className="mr-1">💬</span>
      {current.content}
    </div>
  );
}
