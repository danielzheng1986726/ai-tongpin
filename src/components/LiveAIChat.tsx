"use client";

import { useState, useEffect, useRef, useMemo, useContext } from "react";
import {
  ambientConversations,
  personalityColors,
} from "@/data/ambient-conversations";
import { AIConversationContext } from "@/contexts/AIConversationContext";

interface User {
  id: string;
  username: string;
  personalityType?: string | null;
}

interface LiveMessage {
  username: string;
  personalityType: string;
  text: string;
  id: string;
}

interface LiveAIChatProps {
  users: User[];
}

export default function LiveAIChat({ users }: LiveAIChatProps) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiConversation = useContext(AIConversationContext);

  const usersWithPersonality = useMemo(
    () => users.filter((u) => u.personalityType),
    [users]
  );

  // Store context functions in ref so playConversationFn can access without dependency changes
  const aiConvRef = useRef(aiConversation);
  aiConvRef.current = aiConversation;

  const generateConversationRef = useRef<() => ReturnType<typeof generateConversationFn> | null>(null);

  function generateConversationFn() {
    if (usersWithPersonality.length < 2) return null;

    const conv =
      ambientConversations[
        Math.floor(Math.random() * ambientConversations.length)
      ];

    const neededPersonalities = [
      ...new Set(conv.messages.map((m) => m.personality)),
    ];

    const assignedUsers: Record<string, User> = {};
    const usedUserIds = new Set<string>();

    for (const pType of neededPersonalities) {
      let candidate = usersWithPersonality.find(
        (u) => u.personalityType === pType && !usedUserIds.has(u.id)
      );
      if (!candidate) {
        const available = usersWithPersonality.filter(
          (u) => !usedUserIds.has(u.id)
        );
        if (available.length === 0) return null;
        candidate = available[Math.floor(Math.random() * available.length)];
      }
      assignedUsers[pType] = candidate;
      usedUserIds.add(candidate.id);
    }

    return { conv, assignedUsers };
  }

  const playConversationRef = useRef<() => Promise<void>>(null);

  async function playConversationFn() {
    const result = generateConversationRef.current?.();
    if (!result) return;

    const { conv, assignedUsers } = result;

    setMessages([]);
    setCurrentTopic(conv.topic);

    // Broadcast topic info to context (for AIHighlights & PixelRoom)
    const allUsers = Object.values(assignedUsers);
    aiConvRef.current.setTopicInfo(
      conv.topic,
      allUsers[0]?.username || "",
      allUsers[1]?.username || ""
    );

    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i];
      const user = assignedUsers[msg.personality];
      const pType = user.personalityType || msg.personality;

      await new Promise((r) => setTimeout(r, 2500 + Math.random() * 1500));

      // Broadcast current speaker to context
      aiConvRef.current.broadcast(user.username, msg.text);

      setMessages((prev) => [
        ...prev,
        {
          username: user.username,
          personalityType: pType,
          text: msg.text,
          id: `${Date.now()}-${i}`,
        },
      ]);

      if (i < conv.messages.length - 1) {
        await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
      }
    }

    await new Promise((r) => setTimeout(r, 10000));
  }

  // Keep refs up to date
  generateConversationRef.current = generateConversationFn;
  playConversationRef.current = playConversationFn;

  useEffect(() => {
    if (usersWithPersonality.length < 2) return;

    let cancelled = false;

    const loop = async () => {
      while (!cancelled) {
        await playConversationRef.current?.();
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
    };

    loop();

    return () => {
      cancelled = true;
    };
  }, [usersWithPersonality.length]);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  if (usersWithPersonality.length < 2) {
    return null;
  }

  const getColor = (pType: string) => {
    return personalityColors[pType] || personalityColors.aurora;
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-3 px-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-t-xl border border-white/10 border-b-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-white/60 font-medium">
            TA们的AI分身正在热聊
          </span>
        </div>
        {currentTopic && (
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            #{currentTopic}
          </span>
        )}
      </div>

      {/* Chat area */}
      <div className="bg-black/20 border-x border-white/10 px-3 py-2 h-40 overflow-y-auto">
        {messages.map((msg) => {
          const color = getColor(msg.personalityType);
          return (
            <div key={msg.id} className="mb-2.5 animate-[fadeIn_0.4s_ease-out]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                  }}
                />
                <span className="text-[11px] font-medium" style={{ color: color.to }}>
                  {msg.username}
                </span>
                <span className="text-[9px] text-white/20">
                  {color.name}
                </span>
              </div>
              <p className="text-xs text-white/60 pl-3 leading-relaxed">
                {msg.text}
              </p>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-black/10 rounded-b-xl border border-t-0 border-white/10">
        <p className="text-[9px] text-white/20 text-center">
          AI 分身们正在自由交流 · 基于真实职场人格
        </p>
      </div>
    </div>
  );
}
