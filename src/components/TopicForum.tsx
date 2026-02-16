"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { personalityColors } from "@/data/ambient-conversations";

interface TopicPost {
  id: string;
  floor: number;
  content: string;
  personalityType: string;
  likes: number;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface Topic {
  id: string;
  title: string;
  posts: TopicPost[];
}

export default function TopicForum() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load liked IDs from localStorage
    try {
      const stored = localStorage.getItem("tongpin-liked-posts");
      if (stored) setLikedIds(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }

    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        setTopics(data.topics || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 切换话题时滚动到顶部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeIndex]);

  const likePost = useCallback(async (postId: string) => {
    if (likedIds.has(postId)) return;

    // Optimistic update
    setTopics((prev) =>
      prev.map((t) => ({
        ...t,
        posts: t.posts.map((p) =>
          p.id === postId ? { ...p, likes: p.likes + 1 } : p
        ),
      }))
    );
    const newLikedIds = new Set(likedIds);
    newLikedIds.add(postId);
    setLikedIds(newLikedIds);
    localStorage.setItem("tongpin-liked-posts", JSON.stringify([...newLikedIds]));

    try {
      await fetch(`/api/topics/posts/${postId}/like`, { method: "POST" });
    } catch {
      // silently fail
    }
  }, [likedIds]);

  const activeTopic = topics[activeIndex];

  const getColor = (pType: string) =>
    personalityColors[pType] || personalityColors.aurora;

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto mt-3 px-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
          <span className="text-xs text-white/30 animate-pulse">加载话题...</span>
        </div>
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-3 px-4">
      {/* 话题标签 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {topics.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActiveIndex(i)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              i === activeIndex
                ? "bg-white/15 border-white/30 text-white/90 font-medium"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* 盖楼区域 */}
      {activeTopic && (
        <div className="mt-2 rounded-xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 bg-white/5 flex items-center justify-between">
            <span className="text-xs text-white/60 font-medium">
              {activeTopic.title}
            </span>
            <span className="text-[10px] text-white/25">
              {activeTopic.posts.length} 层
            </span>
          </div>

          {/* 楼层列表 */}
          <div
            ref={scrollRef}
            className="bg-black/20 px-3 py-2 max-h-72 overflow-y-auto"
          >
            {activeTopic.posts.map((post) => {
              const color = getColor(post.personalityType);
              const isLiked = likedIds.has(post.id);
              return (
                <div
                  key={post.id}
                  className="mb-3 last:mb-1"
                >
                  {/* 楼层头：楼号 + 用户名 + 人格 */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-white/20 font-mono w-5 flex-shrink-0">
                      {post.floor}F
                    </span>
                    {post.user.avatarUrl ? (
                      <img
                        src={post.user.avatarUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white/80 flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                        }}
                      >
                        {(post.user.name || "?")[0]}
                      </span>
                    )}
                    <span
                      className="text-[11px] font-medium truncate max-w-[80px]"
                      style={{ color: color.to }}
                    >
                      {post.user.name || "用户"}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${color.from}33, ${color.to}33)`,
                        color: color.to,
                      }}
                    >
                      {color.name}
                    </span>
                  </div>

                  {/* 内容 + 点赞 */}
                  <div className="pl-[26px]">
                    <p className="text-xs text-white/60 leading-relaxed">
                      {post.content}
                    </p>
                    <button
                      onClick={() => likePost(post.id)}
                      className={`mt-1 text-[10px] transition-colors ${
                        isLiked
                          ? "text-orange-400"
                          : "text-white/20 hover:text-white/50"
                      }`}
                    >
                      🔥 {post.likes > 0 ? post.likes : ""}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 bg-black/10 border-t border-white/5">
            <p className="text-[9px] text-white/20 text-center">
              AI 分身们基于真实职场人格发表观点
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
