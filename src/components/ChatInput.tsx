"use client";

import { useState, useRef } from "react";
import EmojiReactions from "@/components/EmojiReactions";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  username?: string;
}

export default function ChatInput({
  onSend,
  disabled,
  username,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full bg-black/40 backdrop-blur-md border-t border-white/10 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="发一条弹幕到同频小屋..."
            disabled={disabled}
            maxLength={50}
            className="w-full bg-white/10 border border-white/15 rounded-full px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-teal-500 text-white text-sm font-medium px-4 py-2 rounded-full disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          发送
        </button>
        <EmojiReactions onSend={(emoji) => !disabled && onSend(emoji)} />
      </div>
    </div>
  );
}
