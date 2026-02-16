"use client";

import { useState, useEffect } from "react";

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

  // Load highlights from DB on mount and refresh periodically
  useEffect(() => {
    const fetchHighlights = async () => {
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
    };

    fetchHighlights();

    // Refresh from DB every 30 seconds to pick up new extractions
    const refreshInterval = setInterval(fetchHighlights, 30000);
    return () => clearInterval(refreshInterval);
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
