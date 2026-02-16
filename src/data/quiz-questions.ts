import type { PersonalityScores } from "@/lib/personality";

export interface QuizOption {
  text: string;
  scores: Partial<PersonalityScores>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "周一早上闹钟响了，你的第一反应是？",
    options: [
      { text: "查手机有没有行业新消息", scores: { industry: 12 } },
      { text: "脑子里过一遍今天的核心目标", scores: { career: 12 } },
      { text: "已经在想今天要试的新点子了", scores: { workStyle: 12 } },
      { text: "想想今天要见谁，期待聊点什么", scores: { values: 12 } },
    ],
  },
  {
    id: 2,
    question: "团队头脑风暴，你通常是那个……",
    options: [
      { text: "第一个拍桌子说「我有个想法」的人", scores: { workStyle: 12, career: 5 } },
      { text: "最后说出一个谁都没想到的角度", scores: { industry: 12 } },
      { text: "先确认目标再讨论方案", scores: { career: 12, industry: 5 } },
      { text: "确保每个人都有机会发言", scores: { values: 12 } },
    ],
  },
  {
    id: 3,
    question: "工作中最让你来劲的时刻？",
    options: [
      { text: "搞懂了一个之前完全不理解的复杂问题", scores: { industry: 12 } },
      { text: "快速交付了一个让所有人惊讶的结果", scores: { workStyle: 12, career: 5 } },
      { text: "看到团队因为你的协调配合得特别好", scores: { values: 12 } },
      { text: "制定了一个清晰方向，所有人都被说服", scores: { career: 12, industry: 5 } },
    ],
  },
  {
    id: 4,
    question: "选一个超能力用在工作里？",
    options: [
      { text: "读心术——瞬间知道对方在想什么", scores: { values: 12, industry: 5 } },
      { text: "时间暂停——有足够的时间把事情想透", scores: { industry: 12 } },
      { text: "瞬间移动——效率拉满，永远不迟到", scores: { workStyle: 12 } },
      { text: "预知未来——提前三个月知道行业趋势", scores: { career: 12, industry: 5 } },
    ],
  },
  {
    id: 5,
    question: "同事分享了一个你完全不懂的新概念，你会？",
    options: [
      { text: "立刻搜索，花二十分钟搞清楚", scores: { industry: 12 } },
      { text: "先问「这跟我们的目标有什么关系？」", scores: { career: 12 } },
      { text: "已经在想怎么用到手头的项目里", scores: { workStyle: 12, industry: 5 } },
      { text: "想想谁最懂这个，约个咖啡聊聊", scores: { values: 12 } },
    ],
  },
  {
    id: 6,
    question: "周五下午三点，活儿提前做完了。你会？",
    options: [
      { text: "研究一个一直想深入了解的专业话题", scores: { industry: 12 } },
      { text: "找下周要合作的同事提前聊聊", scores: { values: 12, career: 5 } },
      { text: "开始搞一个之前一直想试的 side project", scores: { workStyle: 12 } },
      { text: "复盘这周的进展，调整下周计划", scores: { career: 12 } },
    ],
  },
  {
    id: 7,
    question: "年终 review，你最想听到老板说？",
    options: [
      { text: "「你的专业能力是团队里最扎实的」", scores: { industry: 12 } },
      { text: "「你让这个团队变得更好了」", scores: { values: 12 } },
      { text: "「你总是能把事情推动起来」", scores: { workStyle: 12, career: 5 } },
      { text: "「你的格局和判断力让我印象深刻」", scores: { career: 12, industry: 5 } },
    ],
  },
  {
    id: 8,
    question: "如果团队是一支乐队，你想当？",
    options: [
      { text: "主唱——站最前面，带动全场", scores: { workStyle: 12, values: 5 } },
      { text: "贝斯手——不抢风头，但没你节奏就垮", scores: { values: 12 } },
      { text: "键盘手——技术最复杂的部分交给你", scores: { industry: 12 } },
      { text: "乐队经理——谁上场、演什么，你说了算", scores: { career: 12 } },
    ],
  },
];

export function calculateScores(answers: number[]): PersonalityScores {
  const base: PersonalityScores = { career: 50, industry: 50, workStyle: 50, values: 50 };

  answers.forEach((optionIndex, questionIndex) => {
    const question = QUIZ_QUESTIONS[questionIndex];
    if (!question || optionIndex < 0 || optionIndex >= question.options.length) return;
    const scores = question.options[optionIndex].scores;
    if (scores.career) base.career += scores.career;
    if (scores.industry) base.industry += scores.industry;
    if (scores.workStyle) base.workStyle += scores.workStyle;
    if (scores.values) base.values += scores.values;
  });

  return base;
}
