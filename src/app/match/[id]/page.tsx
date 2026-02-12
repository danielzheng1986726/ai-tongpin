"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  PERSONALITIES,
  getRelationshipQuote,
  type PersonalityKey,
} from "@/data/personalities";
import html2canvas from "html2canvas";

interface Dimension {
  score: number;
  label: string;
  reason: string;
}

interface MatchReport {
  totalScore: number;
  dimensions: {
    career: Dimension;
    industry: Dimension;
    workStyle: Dimension;
    values: Dimension;
  };
  summary: string;
  recommendation: string;
}

interface ChatRound {
  question: string;
  answer: string;
}

interface UserBrief {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  shadesJson: string | null;
  personalityType: string | null;
}

interface MatchData {
  id: string;
  status: string;
  score: number;
  report: MatchReport;
  chatLog: ChatRound[];
  createdAt: string;
  userA: UserBrief;
  userB: UserBrief;
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/match/${id}`);
      if (!res.ok) {
        setError("无法加载匹配结果");
        return;
      }
      const data: MatchData = await res.json();
      setMatch(data);
      return data.status;
    } catch {
      setError("网络错误");
    }
  }, [id]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    fetchMatch().then((status) => {
      if (status === "processing") {
        timer = setInterval(async () => {
          const s = await fetchMatch();
          if (s !== "processing") clearInterval(timer);
        }, 3000);
      }
    });

    return () => clearInterval(timer);
  }, [fetchMatch]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href="/" className="text-sm text-gray-900 underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  if (match.status === "processing") {
    return <ProcessingView userB={match.userB} />;
  }

  if (match.status === "failed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">匹配过程出现错误，请重试</p>
          <Link href="/" className="text-sm text-gray-900 underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return <ReportView match={match} />;
}

/* ========== 匹配中动画 ========== */
function ProcessingView({ userB }: { userB: UserBrief }) {
  const steps = [
    "正在连接 AI...",
    "了解职业方向中...",
    "探索行业认知中...",
    "分析工作风格中...",
    "对比价值观中...",
    "生成匹配报告...",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-6">
          {userB.avatarUrl ? (
            <img
              src={userB.avatarUrl}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-gray-400">
              {(userB.name || "U")[0]}
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          正在与 {userB.name || "对方"} 的 AI 深度对话
        </h2>
        <p className="text-sm text-gray-500 mb-6">{steps[step]}</p>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== 分数计数动画 ========== */
function useCountUp(target: number, duration: number = 1500): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ========== 双色融合渐变 ========== */
function buildFusionGradient(
  pA: (typeof PERSONALITIES)[PersonalityKey] | null,
  pB: (typeof PERSONALITIES)[PersonalityKey] | null,
  score: number
): string {
  const fromA = pA?.colors.from || "#6366f1";
  const toA = pA?.colors.to || "#8b5cf6";
  const fromB = pB?.colors.from || "#06b6d4";
  const toB = pB?.colors.to || "#3b82f6";

  // Higher score = softer blend (wider transition zone)
  const midLeft = score >= 75 ? 25 : 45;
  const midRight = score >= 75 ? 75 : 55;

  return `linear-gradient(135deg, ${fromA} 0%, ${toA} ${midLeft}%, ${fromB} ${midRight}%, ${toB} 100%)`;
}

/* ========== 匹配报告 ========== */
function ReportView({ match }: { match: MatchData }) {
  const { report, chatLog, userA, userB } = match;
  const [showChat, setShowChat] = useState(false);

  const pA = userA.personalityType
    ? PERSONALITIES[userA.personalityType as PersonalityKey] || null
    : null;
  const pB = userB.personalityType
    ? PERSONALITIES[userB.personalityType as PersonalityKey] || null
    : null;

  const fusionGradient = buildFusionGradient(pA, pB, report.totalScore);
  const displayScore = useCountUp(report.totalScore);

  const relationQuote =
    pA && pB
      ? getRelationshipQuote(
          userA.personalityType as PersonalityKey,
          userB.personalityType as PersonalityKey
        )
      : null;

  const dims = report.dimensions
    ? [
        report.dimensions.career,
        report.dimensions.industry,
        report.dimensions.workStyle,
        report.dimensions.values,
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; 返回发现
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">匹配报告</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 双色融合卡片 */}
        <div
          id="match-card"
          className="rounded-2xl overflow-hidden animate-gradient-flow animate-score-reveal"
          style={{ background: fusionGradient, color: "#FFFFFF" }}
        >
          <div className="px-8 py-10">
            {/* 头像 + 分数 */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex flex-col items-center gap-2">
                <MatchAvatar user={userA} />
                {pA && (
                  <span className="text-xs font-medium opacity-80">
                    {pA.name}
                  </span>
                )}
                <span className="text-xs opacity-60">
                  {userA.name || "用户A"}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold">{displayScore}</div>
                <span className="text-sm opacity-60 mt-1">匹配度</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <MatchAvatar user={userB} />
                {pB && (
                  <span className="text-xs font-medium opacity-80">
                    {pB.name}
                  </span>
                )}
                <span className="text-xs opacity-60">
                  {userB.name || "用户B"}
                </span>
              </div>
            </div>

            {/* 关系金句 */}
            {relationQuote && (
              <div className="text-center mb-4">
                <p className="text-lg font-medium opacity-90">
                  "{relationQuote}"
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="text-center">
              <p className="text-sm opacity-70">{report.summary}</p>
            </div>
          </div>
        </div>

        {/* 四维分数 */}
        {dims.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-fade-up">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              维度分析
            </h3>
            <div className="space-y-4">
              {dims.map((dim, i) => {
                const barColor = pA?.colors.from || "#6366f1";
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {dim.label}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: barColor }}
                      >
                        {dim.score}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${dim.score}%`,
                          background: `linear-gradient(90deg, ${pA?.colors.from || "#6366f1"}, ${pB?.colors.from || "#06b6d4"})`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{dim.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI 对话区域 */}
        {chatLog.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              AI 对话摘要
            </h3>
            {/* 精华摘要（始终可见） */}
            <ChatSummary chatLog={chatLog} />

            {/* 完整对话（默认折叠） */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="mt-4 w-full flex items-center justify-between text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span>完整对话记录</span>
              <span className="text-xs">
                {showChat ? "收起 ▲" : "展开 ▼"}
              </span>
            </button>
            {showChat && (
              <ChatBubbles
                chatLog={chatLog}
                pA={pA}
                pB={pB}
                nameA={userA.name || "我的 AI"}
                nameB={userB.name || "对方 AI"}
              />
            )}
          </div>
        )}

        {/* 推荐理由 */}
        {report.recommendation && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-600">{report.recommendation}</p>
          </div>
        )}

        {/* 底部操作 */}
        <div className="flex flex-col items-center gap-3 pb-8">
          <ShareMatchButton match={match} fusionGradient={fusionGradient} pA={pA} pB={pB} relationQuote={relationQuote} />
          <a
            href="https://www.secondme.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-teal-500 text-white text-sm font-medium px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            去 SecondMe 开启对话 →
          </a>
          <Link
            href="/"
            className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            继续发现更多人
          </Link>
        </div>

        {/* 品牌 footer */}
        <div className="text-center pb-4 text-xs text-gray-300">
          同频 · ai-tongpin.vercel.app
        </div>
      </main>
    </div>
  );
}

function ShareMatchButton({
  match,
  fusionGradient,
  pA,
  pB,
  relationQuote,
}: {
  match: MatchData;
  fusionGradient: string;
  pA: (typeof PERSONALITIES)[PersonalityKey] | null;
  pB: (typeof PERSONALITIES)[PersonalityKey] | null;
  relationQuote: string | null;
}) {
  const [sharing, setSharing] = useState(false);
  const { report, userA, userB } = match;

  const handleShare = async () => {
    setSharing(true);
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      left: "-9999px",
      top: "0",
      width: "375px",
      zIndex: "-1",
    });

    const makeAvatar = (user: UserBrief) =>
      user.avatarUrl
        ? `<img src="${user.avatarUrl}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3);" crossorigin="anonymous" />`
        : `<div style="width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;border:2px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);">${(user.name || "U")[0]}</div>`;

    const quoteHtml = relationQuote
      ? `<div style="text-align:center;margin-bottom:16px;"><p style="font-size:17px;font-weight:500;opacity:0.9;">"${relationQuote}"</p></div>`
      : "";

    container.innerHTML = `
      <div style="background:${fusionGradient};color:#FFFFFF;border-radius:16px;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;">
        <div style="padding:40px 32px 40px 32px;">
          <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:24px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
              ${makeAvatar(userA)}
              ${pA ? `<span style="font-size:12px;font-weight:500;opacity:0.8;">${pA.name}</span>` : ""}
              <span style="font-size:12px;opacity:0.6;">${userA.name || "用户A"}</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="font-size:48px;font-weight:bold;">${report.totalScore}</div>
              <span style="font-size:14px;opacity:0.6;margin-top:4px;">匹配度</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
              ${makeAvatar(userB)}
              ${pB ? `<span style="font-size:12px;font-weight:500;opacity:0.8;">${pB.name}</span>` : ""}
              <span style="font-size:12px;opacity:0.6;">${userB.name || "用户B"}</span>
            </div>
          </div>
          ${quoteHtml}
          <div style="text-align:center;">
            <p style="font-size:14px;opacity:0.7;">${report.summary}</p>
          </div>
          <div style="text-align:center;margin-top:24px;font-size:12px;opacity:0.4;">
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
        a.download = "match-report.png";
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

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
    >
      {sharing ? "生成中..." : "分享匹配报告"}
    </button>
  );
}

function MatchAvatar({ user }: { user: UserBrief }) {
  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
    />
  ) : (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/30"
      style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
    >
      {(user.name || "U")[0]}
    </div>
  );
}

/* ========== 精华摘要 ========== */
function ChatSummary({ chatLog }: { chatLog: ChatRound[] }) {
  // Extract key sentences from answers to build a brief summary
  const keyPoints = chatLog.map((round) => {
    const text = round.answer.replace(/\*\*/g, "").replace(/#+\s*/g, "");
    // Take the first meaningful sentence (up to first period/。)
    const match = text.match(/^(.{15,80}?[。！？.!?])/);
    return match ? match[1] : text.slice(0, 60) + "...";
  });

  return (
    <div className="text-sm text-gray-600 leading-relaxed space-y-1 bg-gray-50 rounded-xl p-4">
      <p>
        双方围绕<strong>职业方向</strong>、<strong>行业认知</strong>、
        <strong>工作风格</strong>和<strong>价值观</strong>四个维度展开了深度对话：
      </p>
      <ul className="list-disc list-inside space-y-0.5 text-gray-500">
        {keyPoints.map((point, i) => (
          <li key={i}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

/* ========== 聊天气泡 ========== */
function ChatBubbles({
  chatLog,
  pA,
  pB,
  nameA,
  nameB,
}: {
  chatLog: ChatRound[];
  pA: (typeof PERSONALITIES)[PersonalityKey] | null;
  pB: (typeof PERSONALITIES)[PersonalityKey] | null;
  nameA: string;
  nameB: string;
}) {
  const gradA = pA?.colors.gradient || "linear-gradient(135deg, #6366f1, #8b5cf6)";
  const textA = pA?.colors.text || "#FFFFFF";
  const gradB = pB?.colors.gradient || "linear-gradient(135deg, #06b6d4, #3b82f6)";
  const textB = pB?.colors.text || "#FFFFFF";

  return (
    <div className="mt-4 space-y-4">
      {chatLog.map((round, i) => (
        <div key={i} className="space-y-3">
          {/* 左侧：我的 AI 提问 */}
          <div className="flex items-start gap-2">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
              style={{ background: gradA, color: textA }}
            >
              {nameA[0]}
            </div>
            <div
              className="max-w-[80%] rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed"
              style={{ background: gradA, color: textA }}
            >
              <SimpleMarkdown text={round.question} />
            </div>
          </div>
          {/* 右侧：对方 AI 回答 */}
          <div className="flex items-start gap-2 justify-end">
            <div
              className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed"
              style={{ background: gradB, color: textB }}
            >
              <SimpleMarkdown text={round.answer} />
            </div>
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
              style={{ background: gradB, color: textB }}
            >
              {nameB[0]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========== 简易 Markdown 渲染 ========== */
function SimpleMarkdown({ text }: { text: string }) {
  // Split into lines first, then process inline formatting
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="list-decimal list-inside space-y-0.5 my-1"
        >
          {listItems.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushList();
      continue;
    }

    // Numbered list: "1. xxx" or "1、xxx"
    const listMatch = line.match(/^\d+[.、]\s*(.+)/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      continue;
    }

    // Bullet list: "- xxx" or "* xxx"
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();

    // Heading: strip "### " etc
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      elements.push(
        <p key={i} className="font-semibold">
          {renderInline(headingMatch[1])}
        </p>
      );
      continue;
    }

    // Normal line
    elements.push(
      <p key={i}>{renderInline(line)}</p>
    );
  }

  flushList();

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>;
    }
    return part;
  });
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}
