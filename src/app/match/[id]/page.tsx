"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

/* ========== 匹配报告 ========== */
function ReportView({ match }: { match: MatchData }) {
  const { report, chatLog, userA, userB } = match;
  const dims = report.dimensions
    ? [report.dimensions.career, report.dimensions.industry, report.dimensions.workStyle, report.dimensions.values]
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
        {/* 双方头像 + 总分 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <Avatar user={userA} />
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke={scoreColor(report.totalScore)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(report.totalScore / 100) * 213.6} 213.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">
                    {report.totalScore}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-400 mt-1">匹配度</span>
            </div>
            <Avatar user={userB} />
          </div>
          <p className="text-gray-700 font-medium">{report.summary}</p>
          <p className="text-sm text-gray-500 mt-2">{report.recommendation}</p>
        </div>

        {/* 各维度得分 */}
        {dims.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">维度分析</h3>
            <div className="space-y-4">
              {dims.map((dim, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {dim.label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: scoreColor(dim.score) }}>
                      {dim.score}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${dim.score}%`,
                        backgroundColor: scoreColor(dim.score),
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{dim.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI 对话记录 */}
        {chatLog.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              AI 对话摘要
            </h3>
            <div className="space-y-4">
              {chatLog.map((round, i) => (
                <div key={i} className="border-l-2 border-gray-100 pl-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Q{i + 1}: {round.question}
                  </p>
                  <p className="text-sm text-gray-800">{round.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部操作 */}
        <div className="text-center pb-8">
          <Link
            href="/"
            className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            继续发现更多人
          </Link>
        </div>
      </main>
    </div>
  );
}

function Avatar({ user }: { user: UserBrief }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
          {(user.name || "U")[0]}
        </div>
      )}
      <span className="text-xs text-gray-600">{user.name || "用户"}</span>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}
