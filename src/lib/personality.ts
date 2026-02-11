import { type PersonalityKey } from "@/data/personalities";

export interface PersonalityScores {
  career: number;
  industry: number;
  workStyle: number;
  values: number;
}

export function classifyPersonality(scores: PersonalityScores): PersonalityKey {
  const entries = [
    { dim: "career" as const, val: scores.career },
    { dim: "industry" as const, val: scores.industry },
    { dim: "workStyle" as const, val: scores.workStyle },
    { dim: "values" as const, val: scores.values },
  ].sort((a, b) => b.val - a.val);

  const highest = entries[0];
  const second = entries[1];
  const lowest = entries[3];
  const spread = highest.val - lowest.val;

  // 四维分差很小 = 真正均衡的人 → 极光
  if (spread <= 10) return "aurora";

  // 按最强维度 + 次强维度组合分类
  if (highest.dim === "career") {
    return second.dim === "industry" ? "brightmoon" : "spark";
  }

  if (highest.dim === "industry") {
    return scores.workStyle <= scores.industry - 10 ? "deepsea" : "brightmoon";
  }

  if (highest.dim === "workStyle") {
    return second.dim === "career" ? "spark" : "lightning";
  }

  if (highest.dim === "values") {
    if (lowest.dim === "workStyle") {
      return second.dim === "industry" ? "springbreeze" : "bedrock";
    }
    if (lowest.dim === "career") return "warmsun";
    return "springbreeze";
  }

  return "aurora";
}
