"use client";

const REACTIONS = ["👍", "🔥", "😂", "💀", "🤯"];

interface EmojiReactionsProps {
  onSend: (emoji: string) => void;
}

export default function EmojiReactions({ onSend }: EmojiReactionsProps) {
  return (
    <div className="flex gap-1.5">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSend(emoji)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15
            flex items-center justify-center text-base
            transition-all hover:scale-110 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
