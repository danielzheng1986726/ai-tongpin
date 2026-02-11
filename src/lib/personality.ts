import { type PersonalityKey } from "@/data/personalities";

export interface PersonalityScores {
  career: number;
  industry: number;
  workStyle: number;
  values: number;
}

interface ClassificationRule {
  key: PersonalityKey;
  conditions: ((s: PersonalityScores) => boolean)[];
}

const RULES: ClassificationRule[] = [
  {
    key: "spark",
    conditions: [(s) => s.career >= 65, (s) => s.workStyle >= 65],
  },
  {
    key: "deepsea",
    conditions: [(s) => s.industry >= 65, (s) => s.workStyle < 50],
  },
  {
    key: "aurora",
    conditions: [
      (s) => s.career >= 55,
      (s) => s.industry >= 55,
      (s) => s.values >= 55,
    ],
  },
  {
    key: "warmsun",
    conditions: [(s) => s.values >= 65, (s) => s.industry >= 50],
  },
  {
    key: "bedrock",
    conditions: [(s) => s.values >= 60, (s) => s.workStyle < 55],
  },
  {
    key: "lightning",
    conditions: [(s) => s.workStyle >= 70, (s) => s.career >= 50],
  },
  {
    key: "brightmoon",
    conditions: [
      (s) => s.industry >= 65,
      (s) => s.career >= 55,
      (s) => s.workStyle < 60,
    ],
  },
  {
    key: "springbreeze",
    conditions: [
      (s) => s.values >= 60,
      (s) => s.workStyle >= 45,
      (s) => s.workStyle <= 60,
    ],
  },
];

export function classifyPersonality(scores: PersonalityScores): PersonalityKey {
  let bestKey: PersonalityKey = "aurora";
  let bestCount = 0;

  for (const rule of RULES) {
    const matched = rule.conditions.filter((cond) => cond(scores)).length;
    if (matched === rule.conditions.length && matched > bestCount) {
      bestCount = matched;
      bestKey = rule.key;
    }
  }

  return bestKey;
}
