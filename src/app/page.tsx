"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  PERSONALITIES,
  type PersonalityKey,
} from "@/data/personalities";
import type { PersonalityScores } from "@/lib/personality";
import html2canvas from "html2canvas";

const PixelRoom = dynamic(() => import("@/components/PixelRoom"), { ssr: false });

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  personalityType: string | null;
  personalityScores: PersonalityScores | null;
}

interface OtherUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  shadesJson: string | null;
  personalityType: string | null;
}

export default function Home() {
  const [me, setMe] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        setMe(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={me} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {me ? <DiscoverView currentUser={me} setMe={setMe} /> : <LoginView />}
      </main>
    </div>
  );
}

function Header({ user }: { user: UserInfo | null }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">同频</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.name || "用户"}</span>
            <a
              href="/api/auth/logout"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              退出
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

function LoginView() {
  return (
    <div className="flex flex-col items-center pt-24 gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          找到职场上与你同频的人
        </h2>
        <p className="text-gray-500">
          通过 SecondMe AI 深度了解彼此，智能匹配志同道合的职场伙伴
        </p>
      </div>
      <a
        href="/api/auth/login"
        className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        使用 SecondMe 登录
      </a>
    </div>
  );
}

/* ========== 个人人格卡片区域 ========== */

function PersonalitySection({
  user,
  onUpdate,
}: {
  user: UserInfo;
  onUpdate: (u: UserInfo) => void;
}) {
  const [generating, setGenerating] = useState(false);

  const [sharing, setSharing] = useState(false);

  const handleShare = async (p: (typeof PERSONALITIES)[PersonalityKey]) => {
    setSharing(true);
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      left: "-9999px",
      top: "0",
      width: "375px",
      zIndex: "-1",
    });

    const avatarHtml = user.avatarUrl
      ? `<img src="${user.avatarUrl}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3);margin-bottom:20px;" crossorigin="anonymous" />`
      : `<div style="width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:bold;border:2px solid rgba(255,255,255,0.3);margin-bottom:20px;background:rgba(255,255,255,0.15);">${(user.name || "U")[0].toUpperCase()}</div>`;

    const traitsText = p.traits.join(" · ");

    const partnersHtml = p.bestPartners
      .map((k) => `<span style="font-weight:500;margin-left:4px;">${PERSONALITIES[k].name}</span>`)
      .join("");
    const adjustHtml = p.needAdjustment
      .map((k) => `<span style="font-weight:500;margin-left:4px;">${PERSONALITIES[k].name}</span>`)
      .join("");

    container.innerHTML = `
      <div style="background:${p.colors.gradient};color:${p.colors.text};border-radius:16px;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;">
        <div style="padding:40px 32px 40px 32px;display:flex;flex-direction:column;align-items:center;text-align:center;">
          ${avatarHtml}
          <div style="font-size:30px;font-weight:bold;letter-spacing:2px;margin-bottom:4px;">✦ ${p.name} ✦</div>
          <div style="font-size:13px;opacity:0.6;margin-bottom:16px;">${p.nameEn}</div>
          <div style="font-size:18px;opacity:0.8;margin-bottom:20px;font-style:italic;">${p.quote}</div>
          <div style="font-size:18px;opacity:0.7;margin-bottom:24px;">${traitsText}</div>
          <div style="width:100%;height:1px;background:rgba(255,255,255,0.2);margin-bottom:20px;"></div>
          <div style="display:flex;justify-content:center;gap:32px;font-size:14px;margin-bottom:20px;">
            <div><span style="opacity:0.6;">最佳拍档: </span>${partnersHtml}</div>
            <div><span style="opacity:0.6;">需要磨合: </span>${adjustHtml}</div>
          </div>
          <div style="font-size:12px;opacity:0.5;margin-bottom:24px;">${p.rarityText}</div>
          <div style="font-size:12px;opacity:0.4;">
            <div style="font-weight:600;">同频</div>
            <div>ai-tongpin.vercel.app</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // Wait a tick for images to load
      await new Promise((r) => setTimeout(r, 100));
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-personality.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      // silently fail
    } finally {
      document.body.removeChild(container);
      setSharing(false);
    }
  };

  if (user.personalityType && PERSONALITIES[user.personalityType as PersonalityKey]) {
    const p = PERSONALITIES[user.personalityType as PersonalityKey];
    return (
      <div className="mb-8 animate-fade-up">
        <PersonalityCard user={user} personality={p} />
        <div className="mt-4 text-center">
          <button
            onClick={() => handleShare(p)}
            disabled={sharing}
            className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ background: p.colors.gradient }}
          >
            {sharing ? "生成中..." : "分享我的职场人格"}
          </button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/personality/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        onUpdate({
          ...user,
          personalityType: data.personalityType,
          personalityScores: data.scores,
        });
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-4">✦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          发现你的职场人格
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          基于你的 AI 画像，生成专属职场人格卡片
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI 正在解读你的人格...
            </span>
          ) : (
            "生成我的职场人格"
          )}
        </button>
      </div>
    </div>
  );
}

function PersonalityCard({
  user,
  personality,
}: {
  user: UserInfo;
  personality: (typeof PERSONALITIES)[PersonalityKey];
}) {
  const p = personality;

  return (
    <div
      id="personality-card"
      className="rounded-2xl overflow-hidden animate-gradient-flow"
      style={{ background: p.colors.gradient, color: p.colors.text }}
    >
      <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center">
        {/* 头像 */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="w-20 h-20 rounded-full object-cover border-2 border-white/30 mb-5"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30 mb-5"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {(user.name || "U")[0].toUpperCase()}
          </div>
        )}

        {/* 人格名称 */}
        <div className="text-3xl font-bold tracking-wider mb-1">
          ✦ {p.name} ✦
        </div>
        <div className="text-sm opacity-60 mb-4">{p.nameEn}</div>

        {/* 金句 */}
        <p className="text-lg opacity-80 mb-5 italic">{p.quote}</p>

        {/* 特质标签 */}
        <p className="text-lg opacity-70 mb-6">
          {p.traits.join(" · ")}
        </p>

        {/* 分隔线 */}
        <div
          className="w-full h-px mb-5"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        />

        {/* 社交关系 */}
        <div className="w-full flex justify-center gap-8 text-sm mb-5">
          <div>
            <span className="opacity-60">最佳拍档: </span>
            {p.bestPartners.map((key) => (
              <span key={key} className="font-medium ml-1">
                {PERSONALITIES[key].name}
              </span>
            ))}
          </div>
          <div>
            <span className="opacity-60">需要磨合: </span>
            {p.needAdjustment.map((key) => (
              <span key={key} className="font-medium ml-1">
                {PERSONALITIES[key].name}
              </span>
            ))}
          </div>
        </div>

        {/* 稀缺度 */}
        <p className="text-xs opacity-50 mb-6">{p.rarityText}</p>

        {/* 品牌 */}
        <div className="text-xs opacity-40">
          <div className="font-semibold">同频</div>
          <div>ai-tongpin.vercel.app</div>
        </div>
      </div>
    </div>
  );
}

/* ========== 发现页 ========== */

function DiscoverView({
  currentUser,
  setMe,
}: {
  currentUser: UserInfo;
  setMe: (u: UserInfo) => void;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<OtherUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  }, []);

  const startMatch = useCallback(
    async (targetId: string) => {
      setMatchingId(targetId);
      try {
        const res = await fetch("/api/match/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: targetId }),
        });
        const data = await res.json();
        if (data.matchId) {
          router.push(`/match/${data.matchId}`);
        }
      } catch {
        setMatchingId(null);
      }
    },
    [router]
  );

  return (
    <div>
      {/* 像素小屋 */}
      <PixelRoom />

      {/* 人格卡片 */}
      <PersonalitySection user={currentUser} onUpdate={setMe} />

      {/* 用户列表 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">发现</h2>
        <p className="text-sm text-gray-500 mt-1">
          点击用户卡片，AI 将深度对话分析你们的匹配度
        </p>
      </div>

      {loadingUsers ? (
        <div className="text-center py-20 text-gray-400 animate-pulse">
          加载用户列表...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">暂时没有其他用户</p>
          <p className="text-sm text-gray-400">
            邀请朋友使用 SecondMe 登录，即可开始匹配
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isMatching={matchingId === user.id}
              onMatch={() => startMatch(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({
  user,
  isMatching,
  onMatch,
}: {
  user: OtherUser;
  isMatching: boolean;
  onMatch: () => void;
}) {
  const shades = parseShades(user.shadesJson);
  const personality = user.personalityType
    ? PERSONALITIES[user.personalityType as PersonalityKey]
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
      <div className="flex items-start gap-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg flex-shrink-0">
            {(user.name || "U")[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">
              {user.name || "未设置昵称"}
            </h3>
            {personality && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{
                  background: personality.colors.gradient,
                  color: personality.colors.text,
                }}
              >
                {personality.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 italic truncate">
            {personality ? personality.quote : "刚搬进同频小屋，还在收拾行李🧳"}
          </p>
        </div>
      </div>

      {shades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {shades.slice(0, 5).map((s, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full"
            >
              {s}
            </span>
          ))}
          {shades.length > 5 && (
            <span className="text-xs px-2 py-0.5 text-gray-400">
              +{shades.length - 5}
            </span>
          )}
        </div>
      )}

      <button
        onClick={onMatch}
        disabled={isMatching}
        className="mt-4 w-full text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800"
      >
        {isMatching ? "匹配中..." : "发起 AI 匹配"}
      </button>
    </div>
  );
}

function parseShades(shadesJson: string | null): string[] {
  if (!shadesJson) return [];
  try {
    const arr = JSON.parse(shadesJson);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((s: unknown) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object") {
          const obj = s as Record<string, unknown>;
          // Try common field names, then fall back to first string value
          for (const key of ["name", "label", "title", "text"]) {
            if (typeof obj[key] === "string") return obj[key] as string;
          }
          const first = Object.values(obj).find((v) => typeof v === "string");
          if (first) return first as string;
        }
        return null;
      })
      .filter((s): s is string => s !== null);
  } catch {
    return [];
  }
}
