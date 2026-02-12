"use client";

import { useState, useEffect } from "react";
import { PERSONALITIES, type PersonalityKey } from "@/data/personalities";

const PERSONALITY_EMOJIS: Record<PersonalityKey, string> = {
  spark: "✨",
  deepsea: "🌊",
  aurora: "🌌",
  warmsun: "☀️",
  bedrock: "🪨",
  lightning: "⚡",
  brightmoon: "🌙",
  springbreeze: "🌸",
};

export default function PersonalityReveal({
  personalityType,
  onEnter,
}: {
  personalityType: PersonalityKey;
  onEnter: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const p = PERSONALITIES[personalityType];
  const emoji = PERSONALITY_EMOJIS[personalityType];

  useEffect(() => {
    const flipTimer = setTimeout(() => setFlipped(true), 1000);
    const buttonTimer = setTimeout(() => setShowButton(true), 2000);
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const handleEnter = () => {
    localStorage.setItem("tongpin-personality-seen", "1");
    onEnter();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0F0B1F] to-[#1A1230]">
      {/* Card container with perspective */}
      <div style={{ perspective: "1200px" }}>
        <div
          style={{
            width: 280,
            height: 420,
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.8s ease-in-out",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Back face */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1E1640, #2A1B5E)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Geometric pattern overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.08,
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.5) 28px, rgba(255,255,255,0.5) 29px),
                    repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.5) 28px, rgba(255,255,255,0.5) 29px),
                    repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px),
                    repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)
                  `,
                }}
              />
              {/* Diamond border decoration */}
              <div
                style={{
                  position: "absolute",
                  inset: 16,
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 24,
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 4,
                }}
              />
              {/* Center logo */}
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: 8,
                  zIndex: 1,
                }}
              >
                同频
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.12)",
                  marginTop: 8,
                  letterSpacing: 4,
                  zIndex: 1,
                }}
              >
                TONGPIN
              </div>
            </div>
          </div>

          {/* Front face */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: p.colors.gradient,
                color: p.colors.text,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>
                {emoji}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: 4,
                  marginBottom: 4,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontSize: 14,
                  opacity: 0.6,
                  marginBottom: 24,
                }}
              >
                {p.nameEn}
              </div>
              <div
                style={{
                  width: 40,
                  height: 1,
                  background: "rgba(255,255,255,0.3)",
                  marginBottom: 24,
                }}
              />
              <div
                style={{
                  fontSize: 15,
                  opacity: 0.85,
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                「{p.quote}」
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enter button */}
      <div
        style={{
          marginTop: 48,
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <button
          onClick={handleEnter}
          className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          ✨ 进入同频小屋
        </button>
      </div>
    </div>
  );
}
