"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DanmakuItem {
  id: string;
  text: string;
  username: string;
  color: string;
  top: number;
  speed: number;
  createdAt: number;
}

interface DanmakuOverlayProps {
  messages: { text: string; username: string; color?: string }[];
}

export default function DanmakuOverlay({ messages }: DanmakuOverlayProps) {
  const [items, setItems] = useState<DanmakuItem[]>([]);
  const usedRows = useRef<Set<number>>(new Set());

  const findAvailableRow = useCallback(() => {
    const rows = [8, 18, 28, 38, 48, 58, 68, 78, 88];
    const available = rows.filter((r) => !usedRows.current.has(r));
    if (available.length === 0) {
      return rows[Math.floor(Math.random() * rows.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];

    const row = findAvailableRow();
    usedRows.current.add(row);

    const newItem: DanmakuItem = {
      id: `dm-${Date.now()}-${Math.random()}`,
      text: latest.text,
      username: latest.username,
      color: latest.color || "#E0E7FF",
      top: row,
      speed: 12 + Math.random() * 5,
      createdAt: Date.now(),
    };

    setItems((prev) => [...prev.slice(-30), newItem]);

    setTimeout(() => {
      usedRows.current.delete(row);
    }, (newItem.speed * 1000) / 2);
  }, [messages, findAvailableRow]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setItems((prev) =>
        prev.filter((item) => now - item.createdAt < item.speed * 1000 + 500)
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap"
          style={{
            top: `${item.top}%`,
            animation: `danmakuFly ${item.speed}s linear forwards`,
            right: 0,
          }}
        >
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              color: item.color,
              textShadow:
                "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <span className="opacity-60">{item.username}</span>
            <span>{item.text}</span>
          </span>
        </div>
      ))}

      <style jsx>{`
        @keyframes danmakuFly {
          from {
            transform: translateX(100vw);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
