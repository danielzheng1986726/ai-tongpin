"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface OtherUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  shadesJson: string | null;
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
        {me ? <DiscoverView currentUser={me} /> : <LoginView />}
      </main>
    </div>
  );
}

function Header({ user }: { user: UserInfo | null }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">AI同频</h1>
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

function DiscoverView({ currentUser }: { currentUser: UserInfo }) {
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

  const startMatch = async (targetId: string) => {
    setMatchingId(targetId);
    try {
      const res = await fetch("/api/match/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      const data = await res.json();
      if (data.matchId) {
        // 如果已完成直接跳转，否则跳到报告页轮询
        router.push(`/match/${data.matchId}`);
      }
    } catch {
      setMatchingId(null);
    }
  };

  if (loadingUsers) {
    return (
      <div className="text-center py-20 text-gray-400 animate-pulse">
        加载用户列表...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-2">暂时没有其他用户</p>
        <p className="text-sm text-gray-400">
          邀请朋友使用 SecondMe 登录，即可开始匹配
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">发现</h2>
        <p className="text-sm text-gray-500 mt-1">
          点击用户卡片，AI 将深度对话分析你们的匹配度
        </p>
      </div>
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
          <h3 className="font-medium text-gray-900 truncate">
            {user.name || "未设置昵称"}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {user.email || ""}
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
    return arr.map((s: unknown) => {
      if (typeof s === "string") return s;
      if (s && typeof s === "object" && "name" in s)
        return (s as { name: string }).name;
      return String(s);
    });
  } catch {
    return [];
  }
}
