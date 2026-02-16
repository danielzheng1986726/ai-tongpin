"use client";

import { useState } from "react";
import { QUIZ_QUESTIONS, calculateScores } from "@/data/quiz-questions";
import { classifyPersonality } from "@/lib/personality";
import type { PersonalityScores } from "@/lib/personality";
import { type PersonalityKey } from "@/data/personalities";
import PersonalityReveal from "@/components/PersonalityReveal";

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  personalityType: string | null;
  personalityScores: PersonalityScores | null;
}

interface PersonalityQuizProps {
  onComplete: (user: UserInfo) => void;
  onClose: () => void;
}

type Step = "nickname" | "quiz" | "calculating" | "reveal";

export default function PersonalityQuiz({ onComplete, onClose }: PersonalityQuizProps) {
  const [step, setStep] = useState<Step>("nickname");
  const [nickname, setNickname] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<{ personalityType: string; user: UserInfo | null } | null>(null);

  const startQuiz = () => {
    if (!nickname.trim()) return;
    setStep("quiz");
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null) return; // prevent double-click
    setSelectedOption(optionIndex);
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    setTimeout(() => {
      setSelectedOption(null);
      if (newAnswers.length < QUIZ_QUESTIONS.length) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        setStep("calculating");
        const scores = calculateScores(newAnswers);
        const personalityType = classifyPersonality(scores);

        fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname: nickname.trim(), personalityType, personalityScores: scores }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setResult({ personalityType, user: data.user });
            } else {
              setResult({ personalityType, user: null });
            }
            setTimeout(() => setStep("reveal"), 1500);
          })
          .catch(() => {
            setResult({ personalityType, user: null });
            setTimeout(() => setStep("reveal"), 1500);
          });
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") startQuiz();
  };

  if (step === "reveal" && result) {
    return (
      <PersonalityReveal
        personalityType={result.personalityType as PersonalityKey}
        onEnter={() => {
          localStorage.setItem("tongpin-personality-seen", "1");
          if (result.user) {
            onComplete(result.user);
          } else {
            onClose();
          }
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0B1F] overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white/80 hover:bg-white/20 transition-colors"
      >
        x
      </button>

      {step === "nickname" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <h2 className="text-2xl font-bold text-white mb-2">欢迎来到同频</h2>
          <p className="text-white/50 text-sm mb-8">给自己起个名字，开始探索你的职场人格</p>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="你的昵称"
            maxLength={20}
            className="w-full max-w-xs bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg placeholder-white/30 focus:outline-none focus:border-purple-500/50"
            autoFocus
          />
          <button
            onClick={startQuiz}
            disabled={!nickname.trim()}
            className="mt-6 px-8 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-teal-500 text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            开始测试
          </button>
        </div>
      )}

      {step === "quiz" && (
        <div className="flex flex-col min-h-screen px-6 pt-16 pb-8">
          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto h-1 bg-white/10 rounded-full mb-12">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-teal-500 transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            />
          </div>

          <p className="text-white/30 text-xs text-center mb-4">{currentQuestion + 1} / {QUIZ_QUESTIONS.length}</p>

          <h3 className="text-lg font-bold text-white text-center mb-8 leading-relaxed">
            {QUIZ_QUESTIONS[currentQuestion].question}
          </h3>

          <div className="space-y-3 max-w-sm mx-auto w-full">
            {QUIZ_QUESTIONS[currentQuestion].options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full text-left px-5 py-4 rounded-xl border text-sm leading-relaxed active:scale-[0.98] transition-all ${
                  selectedOption === i
                    ? "bg-purple-600/30 border-purple-500/50 text-white"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "calculating" && (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-3xl mb-4 animate-pulse">🔮</div>
          <p className="text-white/60 text-sm">正在解读你的职场人格...</p>
        </div>
      )}
    </div>
  );
}
