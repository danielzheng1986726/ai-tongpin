"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  PERSONALITIES,
  type PersonalityKey,
} from "@/data/personalities";
import { personalityColors } from "@/data/ambient-conversations";
import type { PersonalityScores } from "@/lib/personality";
import html2canvas from "html2canvas";
import TopicForum from "@/components/TopicForum";
import DanmakuOverlay from "@/components/DanmakuOverlay";
import ChatInput from "@/components/ChatInput";
import PersonalityReveal from "@/components/PersonalityReveal";

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
  matchScore: number | null;
  matchId: string | null;
}

interface SelectedChar {
  id: string;
  name: string;
  personalityType: string;
  screenX: number;
  screenY: number;
}

export default function Home() {
  const [me, setMe] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        setMe(data.user);
        // 已登录 + 有人格 + 未看过 → 展示人格揭示页
        if (
          data.user?.personalityType &&
          PERSONALITIES[data.user.personalityType as PersonalityKey] &&
          !localStorage.getItem("tongpin-personality-seen")
        ) {
          setShowReveal(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0B1F]">
        <div className="text-white/40 animate-pulse">加载中...</div>
      </div>
    );
  }

  if (showReveal && me?.personalityType) {
    return (
      <PersonalityReveal
        personalityType={me.personalityType as PersonalityKey}
        onEnter={() => setShowReveal(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0B1F] to-[#1A1230]">
      <Header user={me} />
      {me ? <DiscoverView currentUser={me} setMe={setMe} /> : <LoginView />}
    </div>
  );
}

function Header({ user }: { user: UserInfo | null }) {
  return (
    <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
        <h1 className="text-base font-semibold text-white/90">同频</h1>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50">{user.name || "用户"}</span>
            <a
              href="/api/auth/logout"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
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
    <div className="flex flex-col items-center pt-24 gap-6 px-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          找到职场上与你同频的人
        </h2>
        <p className="text-white/50">
          通过 SecondMe AI 深度了解彼此，智能匹配志同道合的职场伙伴
        </p>
      </div>
      <a
        href="/api/auth/login"
        className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
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
      <div className="animate-fade-up">
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
    <div>
      <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
        <div className="text-4xl mb-4">✦</div>
        <h3 className="text-lg font-semibold text-white mb-2">
          发现你的职场人格
        </h3>
        <p className="text-sm text-white/50 mb-6">
          基于你的 AI 画像，生成专属职场人格卡片
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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

        <div className="text-3xl font-bold tracking-wider mb-1">
          ✦ {p.name} ✦
        </div>
        <div className="text-sm opacity-60 mb-4">{p.nameEn}</div>

        <p className="text-lg opacity-80 mb-5 italic">{p.quote}</p>

        <p className="text-lg opacity-70 mb-6">
          {p.traits.join(" · ")}
        </p>

        <div
          className="w-full h-px mb-5"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        />

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

        <p className="text-xs opacity-50 mb-6">{p.rarityText}</p>

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
  const [showFullCard, setShowFullCard] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [selectedChar, setSelectedChar] = useState<SelectedChar | null>(null);
  const [danmakuMessages, setDanmakuMessages] = useState<{ text: string; username: string; color?: string }[]>([]);
  const danmakuPool = useRef<{ text: string; username: string; color?: string }[]>([]);
  const danmakuIndex = useRef(0);
  const lastDanmakuTime = useRef<string>(new Date().toISOString());

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  }, []);

  // 加载历史弹幕 + 循环播放
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/danmaku");
        const data = await res.json();
        if (data.messages?.length > 0) {
          danmakuPool.current = data.messages.map((m: { message: string; username: string; color: string; createdAt: string }) => ({
            text: m.message,
            username: m.username,
            color: m.color || "#E0E7FF",
          }));
          lastDanmakuTime.current = data.messages[data.messages.length - 1].createdAt;
        }
      } catch {
        // silently fail
      }

      // 循环播放弹幕池
      while (!cancelled) {
        if (danmakuPool.current.length > 0) {
          const msg = danmakuPool.current[danmakuIndex.current % danmakuPool.current.length];
          setDanmakuMessages(prev => [...prev, msg]);
          danmakuIndex.current++;
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // 轮询新弹幕，加入循环池
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/danmaku?after=${encodeURIComponent(lastDanmakuTime.current)}`);
        const data = await res.json();
        if (data.messages?.length > 0) {
          const newMsgs = data.messages.map((m: { message: string; username: string; color: string }) => ({
            text: m.message,
            username: m.username,
            color: m.color || "#E0E7FF",
          }));
          danmakuPool.current = [...danmakuPool.current, ...newMsgs];
          lastDanmakuTime.current = data.messages[data.messages.length - 1].createdAt;
        }
      } catch {
        // silently fail
      }
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  // 发送弹幕
  const handleSendDanmaku = async (message: string) => {
    const pType = currentUser.personalityType as string | undefined;
    const color = pType && personalityColors[pType]
      ? personalityColors[pType].to
      : "#E0E7FF";

    const dmMsg = { text: message, username: currentUser.name || "用户", color };
    setDanmakuMessages(prev => [...prev, dmMsg]);
    danmakuPool.current = [...danmakuPool.current, dmMsg];

    try {
      await fetch("/api/danmaku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.name || "用户",
          message,
          color,
        }),
      });
    } catch {
      // silently fail
    }
  };

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

  // 人格信息
  const pKey = currentUser.personalityType as PersonalityKey | null;
  const personality = pKey ? PERSONALITIES[pKey] : null;

  const matchedUserIds = users.filter(u => u.matchScore != null).map(u => u.id);

  const handleCharClick = useCallback((char: SelectedChar) => {
    setSelectedChar(char);
  }, []);

  const handlePopupMatch = useCallback((targetId: string) => {
    setSelectedChar(null);
    startMatch(targetId);
  }, [startMatch]);

  const handlePopupViewReport = useCallback((matchId: string) => {
    setSelectedChar(null);
    router.push(`/match/${matchId}`);
  }, [router]);

  return (
    <main className="flex flex-col">
      {/* 像素小屋 + 弹幕 */}
      <div className="relative w-full max-w-lg mx-auto" style={{ minHeight: "420px" }}>
        <PixelRoom
          onCharacterClick={handleCharClick}
          matchedUserIds={matchedUserIds}
          currentUser={{ id: currentUser.id, name: currentUser.name || "用户", personalityType: currentUser.personalityType }}
        />
        <DanmakuOverlay messages={danmakuMessages} />
      </div>

      {/* 角色浮层卡片 */}
      {selectedChar && (
        <CharacterPopup
          char={selectedChar}
          users={users}
          currentUser={currentUser}
          matchingId={matchingId}
          onMatch={handlePopupMatch}
          onViewReport={handlePopupViewReport}
          onClose={() => setSelectedChar(null)}
        />
      )}

      {/* 弹幕输入框 */}
      <div className="w-full max-w-lg mx-auto">
        <ChatInput
          onSend={handleSendDanmaku}
          disabled={!currentUser}
          username={currentUser.name || undefined}
        />
      </div>

      {/* 话题盖楼 */}
      <TopicForum />

      {/* 人格卡片 - 折叠版 */}
      <div className="w-full max-w-lg mx-auto px-4 mt-2">
        <button
          onClick={() => setShowFullCard(!showFullCard)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/8 transition-colors"
        >
          <span className="text-sm text-white/70">
            🔮 看一看你的职场人格是什么？
          </span>
          <span className="text-xs text-white/30">
            {showFullCard ? "▲ 收起" : "▼ 展开"}
          </span>
        </button>
        {showFullCard && (
          <div className="mt-2">
            <PersonalitySection user={currentUser} onUpdate={setMe} />
          </div>
        )}
      </div>

      {/* 用户列表 - 默认折叠 */}
      <div className="w-full max-w-lg mx-auto px-4 mt-6 mb-8">
        <button
          onClick={() => setShowUserList(!showUserList)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/8 transition-colors"
        >
          <span className="text-sm text-white/70">
            {users.length > 0 ? `查看全部 ${users.length} 位用户` : "查看用户列表"}
          </span>
          <span className="text-xs text-white/30">
            {showUserList ? "▲ 收起" : "▼ 展开"}
          </span>
        </button>

        {showUserList && (
          <div className="mt-3">
            {loadingUsers ? (
              <div className="text-center py-12 text-white/30 animate-pulse">
                加载用户列表...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40 mb-2">暂时没有其他用户</p>
                <p className="text-sm text-white/25">
                  邀请朋友使用 SecondMe 登录，即可开始匹配
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isMatching={matchingId === user.id}
                    onMatch={() => startMatch(user.id)}
                    currentUserPersonalityType={currentUser.personalityType}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ========== 角色浮层卡片 ========== */

function CharacterPopup({
  char,
  users,
  currentUser,
  matchingId,
  onMatch,
  onViewReport,
  onClose,
}: {
  char: SelectedChar;
  users: OtherUser[];
  currentUser: UserInfo;
  matchingId: string | null;
  onMatch: (targetId: string) => void;
  onViewReport: (matchId: string) => void;
  onClose: () => void;
}) {
  const isMe = char.id === currentUser.id;
  const userInfo = users.find(u => u.id === char.id);
  const personality = char.personalityType && PERSONALITIES[char.personalityType as PersonalityKey]
    ? PERSONALITIES[char.personalityType as PersonalityKey]
    : null;

  const myColor = currentUser.personalityType
    ? personalityColors[currentUser.personalityType]
    : null;
  const theirColor = char.personalityType
    ? personalityColors[char.personalityType]
    : null;

  const gradFrom = myColor?.from || "#7B2FF7";
  const gradTo = theirColor?.to || "#22D1EE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-2xl overflow-hidden animate-[slideUp_0.25s_ease-out]"
        style={{ background: "linear-gradient(180deg, #1A1230 0%, #0F0B1F 100%)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white/80 hover:bg-white/20 transition-colors text-sm z-10"
        >
          x
        </button>

        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          {/* Personality badge circle */}
          {personality ? (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 border-2 border-white/20"
              style={{ background: personality.colors.gradient, color: personality.colors.text }}
            >
              {personality.name[0]}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl text-white/40 mb-4 border-2 border-white/10">
              ?
            </div>
          )}

          {/* Name */}
          <h3 className="text-lg font-bold text-white/90 mb-1">{char.name}</h3>

          {/* Personality tag */}
          {personality && (
            <span
              className="text-xs px-3 py-1 rounded-full font-medium mb-3"
              style={{ background: personality.colors.gradient, color: personality.colors.text }}
            >
              {personality.name} · {personality.nameEn}
            </span>
          )}

          {/* Quote */}
          <p className="text-sm text-white/50 italic mb-5 leading-relaxed">
            {personality ? personality.quote : "刚搬进同频小屋，还在收拾行李..."}
          </p>

          {/* Match score (if matched) */}
          {userInfo?.matchScore != null && (
            <div className="mb-4 flex items-center gap-2">
              <span
                className="text-sm font-bold px-3 py-1 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
              >
                同频指数 {userInfo.matchScore}
              </span>
            </div>
          )}

          {/* Action buttons */}
          {isMe ? (
            <p className="text-xs text-white/30">这是你自己的 AI 分身</p>
          ) : userInfo?.matchScore != null && userInfo?.matchId ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={() => onViewReport(userInfo.matchId!)}
                className="flex-1 text-sm font-medium py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
              >
                查看匹配报告
              </button>
              <button
                onClick={() => onMatch(char.id)}
                disabled={matchingId === char.id}
                className="px-4 text-sm font-medium py-2.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {matchingId === char.id ? "..." : "重新匹配"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => onMatch(char.id)}
              disabled={matchingId === char.id}
              className="w-full text-sm font-medium py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50 bg-gradient-to-r from-purple-600 to-teal-500"
            >
              {matchingId === char.id ? "匹配中..." : "发起 AI 同频"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserCard({
  user,
  isMatching,
  onMatch,
  currentUserPersonalityType,
}: {
  user: OtherUser;
  isMatching: boolean;
  onMatch: () => void;
  currentUserPersonalityType: string | null;
}) {
  const shades = parseShades(user.shadesJson);
  const personality = user.personalityType
    ? PERSONALITIES[user.personalityType as PersonalityKey]
    : null;

  // Badge gradient: current user's color -> target user's color
  const myColor = currentUserPersonalityType
    ? personalityColors[currentUserPersonalityType]
    : null;
  const theirColor = user.personalityType
    ? personalityColors[user.personalityType]
    : null;
  const badgeFrom = myColor?.from || "#7B2FF7";
  const badgeTo = theirColor?.to || "#22D1EE";

  return (
    <div className="relative bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/8 transition-colors">
      {user.matchScore != null && (
        <span
          className="absolute -top-2 -right-2 text-xs font-medium px-2 py-0.5 rounded-full text-white/90"
          style={{ background: `linear-gradient(135deg, ${badgeFrom}, ${badgeTo})` }}
        >
          {user.matchScore}分
        </span>
      )}
      <div className="flex items-start gap-3">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-sm flex-shrink-0">
            {(user.name || "U")[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white/90 truncate text-sm">
              {user.name || "未设置昵称"}
            </h3>
            {personality && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{
                  background: personality.colors.gradient,
                  color: personality.colors.text,
                }}
              >
                {personality.name}
              </span>
            )}
          </div>
          <p className="text-xs text-white/30 italic truncate">
            {personality ? personality.quote : "刚搬进同频小屋，还在收拾行李🧳"}
          </p>
        </div>
      </div>

      {shades.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {shades.slice(0, 5).map((s, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 bg-white/5 text-white/40 rounded-full"
            >
              {s}
            </span>
          ))}
          {shades.length > 5 && (
            <span className="text-[10px] px-1.5 py-0.5 text-white/20">
              +{shades.length - 5}
            </span>
          )}
        </div>
      )}

      <button
        onClick={onMatch}
        disabled={isMatching}
        className="mt-3 w-full text-xs font-medium py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600/80 to-teal-500/80 text-white hover:opacity-90"
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
