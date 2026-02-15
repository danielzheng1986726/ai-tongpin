"use client";

import { useState, useEffect, useCallback } from "react";

interface DailyHighlight {
  id: string;
  content: string;
  topic: string;
  speakerA: string;
  speakerB: string;
  likes: number;
}

export default function DailyBest() {
  const [highlights, setHighlights] = useState<DailyHighlight[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load liked IDs from localStorage
    try {
      const stored = localStorage.getItem("tongpin-liked-highlights");
      if (stored) setLikedIds(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }

    // Fetch today's best highlights
    (async () => {
      try {
        const res = await fetch("/api/highlights/daily");
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

  const likeHighlight = useCallback(async (id: string) => {
    if (likedIds.has(id)) return;

    // Optimistic update
    setHighlights((prev) =>
      prev.map((h) => (h.id === id ? { ...h, likes: h.likes + 1 } : h))
    );
    const newLikedIds = new Set(likedIds);
    newLikedIds.add(id);
    setLikedIds(newLikedIds);
    localStorage.setItem("tongpin-liked-highlights", JSON.stringify([...newLikedIds]));

    try {
      await fetch(`/api/highlights/${id}/like`, { method: "POST" });
    } catch {
      // silently fail
    }
  }, [likedIds]);

  if (highlights.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-4 mt-4">
      <h3 className="text-sm font-medium text-white/60 mb-3">
        🔥 今天 AI 们都在说什么
      </h3>
      <div className="space-y-2">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="rounded-xl p-4 bg-white/5 border border-white/10"
          >
            <p className="text-sm text-white leading-relaxed">{h.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-white/40">
                {h.speakerA} 🤖 vs {h.speakerB} 🤖 · 聊「{h.topic}」
              </span>
              <button
                onClick={() => likeHighlight(h.id)}
                className={`text-xs transition-colors ${
                  likedIds.has(h.id)
                    ? "text-orange-400"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                🔥 {h.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
