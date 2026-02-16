import { chatWithSecondMe, actWithSecondMe, fetchUserShades } from "./secondme";
import { prisma } from "./prisma";
import { PERSONALITIES, type PersonalityKey } from "@/data/personalities";

interface ChatRound {
  question: string;
  answer: string;
}

export interface MatchReport {
  totalScore: number;
  dimensions: {
    career: { score: number; label: string; reason: string };
    industry: { score: number; label: string; reason: string };
    workStyle: { score: number; label: string; reason: string };
    values: { score: number; label: string; reason: string };
  };
  summary: string;
  recommendation: string;
}

const CHAT_QUESTIONS = [
  "你好！我想了解一下你的职业方向。你目前在做什么工作？未来有什么职业规划？",
  "你对所在行业有什么独特的看法？最近在关注什么趋势或变化？",
  "能聊聊你的工作风格吗？比如你喜欢独立工作还是团队协作？工作节奏是快还是稳？",
  "你最看重的职场价值观是什么？你理想中的职场合作伙伴是什么样的？",
];

const SYSTEM_PROMPT =
  "有人想通过对话了解你，请根据你的真实性格、经历和偏好来回答，保持自然真诚。每次回答控制在 100 字以内。";

const ACTION_CONTROL = `仅输出合法 JSON 对象，不要输出任何解释文字。
输出结构：
{
  "totalScore": number(0到100的整数),
  "dimensions": {
    "career": { "score": number(0-100), "label": "职业方向", "reason": "一句话原因" },
    "industry": { "score": number(0-100), "label": "行业认知", "reason": "一句话原因" },
    "workStyle": { "score": number(0-100), "label": "工作风格", "reason": "一句话原因" },
    "values": { "score": number(0-100), "label": "价值观", "reason": "一句话原因" }
  },
  "summary": "30字以内的匹配总结",
  "recommendation": "一句话推荐理由"
}
根据用户A的兴趣特征和用户B的对话回答，从职业方向、行业认知、工作风格、价值观四个维度评估两人的职场匹配程度。totalScore是四个维度的综合评分。`;

export function formatShades(shadesJson: string | null): string {
  if (!shadesJson) return "暂无标签信息";
  try {
    const shades = JSON.parse(shadesJson);
    if (!Array.isArray(shades) || shades.length === 0) return "暂无标签信息";
    return shades
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
      .filter(Boolean)
      .join("、");
  } catch {
    return "暂无标签信息";
  }
}

// === AI Builder path (for guest users) ===

const AI_BUILDER_API_BASE = process.env.AI_BUILDER_API_BASE || "https://space.ai-builders.com/backend";

function isGuestUser(user: { secondmeUserId: string; accessToken: string }): boolean {
  return user.secondmeUserId.startsWith("guest_") || user.accessToken === "";
}

async function callAIBuilder(systemPrompt: string, userMessage: string, options?: { temperature?: number; max_tokens?: number }): Promise<string> {
  const token = process.env.AI_BUILDER_TOKEN;
  if (!token) throw new Error("AI_BUILDER_TOKEN not configured");

  const res = await fetch(`${AI_BUILDER_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 300,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI Builder API failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function simulateChat(user: { name: string | null; personalityType: string | null; personalityScores: string | null }): Promise<ChatRound[]> {
  const pKey = user.personalityType as PersonalityKey | null;
  const personality = pKey ? PERSONALITIES[pKey] : null;

  const personaDesc = personality
    ? `你的职场人格是"${personality.name}"（${personality.nameEn}）。性格特点：${personality.traits.join("、")}。${personality.description}`
    : "你是一个普通的职场人。";

  const systemPrompt = `你在扮演一个叫"${user.name || "某人"}"的职场人。${personaDesc}
请用这个人格的口吻和视角来回答问题。要求：
1. 回答要符合这个人格类型的特征
2. 每次回答控制在80字以内
3. 语气自然真诚，像真人聊天
4. 不要提到你是AI或你在扮演角色`;

  const chatLog: ChatRound[] = [];

  for (let i = 0; i < CHAT_QUESTIONS.length; i++) {
    let prompt = CHAT_QUESTIONS[i];
    if (i > 0) {
      const prevAnswer = chatLog[i - 1].answer;
      prompt = `你刚才说了："${prevAnswer}"\n\n现在对方问你：${CHAT_QUESTIONS[i]}\n\n请先用1句话接上之前的话题，再回答新问题。`;
    }

    const answer = await callAIBuilder(systemPrompt, prompt, { temperature: 0.8, max_tokens: 150 });
    chatLog.push({ question: CHAT_QUESTIONS[i], answer });
  }

  return chatLog;
}

async function generateReportViaAIBuilder(
  userA: { name: string | null; personalityType: string | null; personalityScores: string | null },
  userB: { name: string | null; personalityType: string | null; personalityScores: string | null },
  chatLog: ChatRound[]
): Promise<MatchReport> {
  const pA = userA.personalityType as PersonalityKey | null;
  const pB = userB.personalityType as PersonalityKey | null;
  const personalityA = pA ? PERSONALITIES[pA] : null;
  const personalityB = pB ? PERSONALITIES[pB] : null;

  const chatSummary = chatLog
    .map((r, i) => `问题${i + 1}: ${r.question}\n回答: ${r.answer}`)
    .join("\n\n");

  const systemPrompt = `仅输出合法 JSON 对象，不要输出任何解释文字、不要用markdown代码块包裹。
输出结构：
{
  "totalScore": number(0到100的整数),
  "dimensions": {
    "career": { "score": number(0-100), "label": "职业方向", "reason": "一句话原因" },
    "industry": { "score": number(0-100), "label": "行业认知", "reason": "一句话原因" },
    "workStyle": { "score": number(0-100), "label": "工作风格", "reason": "一句话原因" },
    "values": { "score": number(0-100), "label": "价值观", "reason": "一句话原因" }
  },
  "summary": "30字以内的匹配总结",
  "recommendation": "一句话推荐理由"
}`;

  const userMessage = `## 用户A的信息
姓名: ${userA.name || "未知"}
职场人格: ${personalityA ? `${personalityA.name}（${personalityA.traits.join("、")}）` : "未知"}
${userA.personalityScores ? `四维分数: ${userA.personalityScores}` : ""}

## 用户B的信息
姓名: ${userB.name || "未知"}
职场人格: ${personalityB ? `${personalityB.name}（${personalityB.traits.join("、")}）` : "未知"}
${userB.personalityScores ? `四维分数: ${userB.personalityScores}` : ""}

## 用户B的对话记录
${chatSummary}

请根据以上信息评估用户A和用户B的职场匹配程度。totalScore是四个维度的综合评分。`;

  const result = await callAIBuilder(systemPrompt, userMessage, { temperature: 0.3, max_tokens: 500 });

  try {
    const cleaned = result.replace(/```json\s*|```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
  } catch {
    return {
      totalScore: 70,
      dimensions: {
        career: { score: 70, label: "职业方向", reason: "初步评估，建议进一步沟通" },
        industry: { score: 70, label: "行业认知", reason: "初步评估，建议进一步沟通" },
        workStyle: { score: 70, label: "工作风格", reason: "初步评估，建议进一步沟通" },
        values: { score: 70, label: "价值观", reason: "初步评估，建议进一步沟通" },
      },
      summary: "初步匹配完成，建议进一步沟通了解",
      recommendation: "两位用户有一定的共同特质，值得进一步交流",
    };
  }
}

/**
 * 执行匹配：
 * - 游客用户：用 AI Builder (deepseek) 模拟对话 + 生成报告
 * - SecondMe 用户：用 SecondMe Chat/Act API（原有逻辑）
 */
export async function runMatching(
  matchId: string,
  userAId: string,
  userBId: string
): Promise<void> {
  try {
    // 1. 获取双方资料
    const [userA, userB] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userAId } }),
      prisma.user.findUniqueOrThrow({ where: { id: userBId } }),
    ]);

    // 2. 判断是否走 AI Builder 路径
    const useAIBuilder = isGuestUser(userA) || isGuestUser(userB);

    let chatLog: ChatRound[];
    let report: MatchReport;

    if (useAIBuilder) {
      // === AI Builder path (guest users) ===
      chatLog = await simulateChat(userB);
      report = await generateReportViaAIBuilder(userA, userB, chatLog);
    } else {
      // === SecondMe path (OAuth users) ===

      // 如果 shades 缓存为空，尝试重新拉取
      if (!userA.shadesJson) {
        const shades = await fetchUserShades(userAId);
        if (shades.length > 0) {
          await prisma.user.update({
            where: { id: userAId },
            data: { shadesJson: JSON.stringify(shades) },
          });
          userA.shadesJson = JSON.stringify(shades);
        }
      }
      if (!userB.shadesJson) {
        const shades = await fetchUserShades(userBId);
        if (shades.length > 0) {
          await prisma.user.update({
            where: { id: userBId },
            data: { shadesJson: JSON.stringify(shades) },
          });
          userB.shadesJson = JSON.stringify(shades);
        }
      }

      // 与 User B 的 SecondMe 进行多轮对话
      chatLog = [];
      let sessionId: string | undefined;

      for (let i = 0; i < CHAT_QUESTIONS.length; i++) {
        let question = CHAT_QUESTIONS[i];

        // 第2、3、4轮：先回应对方上一轮的回答，再自然过渡到新话题
        if (i > 0) {
          const prevAnswer = chatLog[i - 1].answer;
          question = `对方刚才说："${prevAnswer}"\n\n请你先用1-2句话自然地回应对方上面提到的内容或观点，然后再自然过渡到下一个话题：${CHAT_QUESTIONS[i]}`;
        }

        const result = await chatWithSecondMe(userBId, question, {
          sessionId,
          systemPrompt: i === 0 ? SYSTEM_PROMPT : undefined,
        });

        if (result.sessionId) sessionId = result.sessionId;

        chatLog.push({ question: CHAT_QUESTIONS[i], answer: result.content });
      }

      // 构造 Act API 的评估输入
      const userAShadesText = formatShades(userA.shadesJson);
      const chatSummary = chatLog
        .map((r, i) => `问题${i + 1}: ${r.question}\n回答: ${r.answer}`)
        .join("\n\n");

      const actMessage = `## 用户A的信息
姓名: ${userA.name || "未知"}
兴趣标签: ${userAShadesText}

## 用户B的对话记录
姓名: ${userB.name || "未知"}
兴趣标签: ${formatShades(userB.shadesJson)}

${chatSummary}

请根据以上信息评估用户A和用户B的职场匹配程度。`;

      // 调用 Act API 生成结构化评分
      const actResult = await actWithSecondMe(userAId, actMessage, ACTION_CONTROL);

      // 解析评分结果
      try {
        const jsonMatch = actResult.match(/\{[\s\S]*\}/);
        report = JSON.parse(jsonMatch ? jsonMatch[0] : actResult);
      } catch {
        report = {
          totalScore: 70,
          dimensions: {
            career: { score: 70, label: "职业方向", reason: "信息不足，无法准确评估" },
            industry: { score: 70, label: "行业认知", reason: "信息不足，无法准确评估" },
            workStyle: { score: 70, label: "工作风格", reason: "信息不足，无法准确评估" },
            values: { score: 70, label: "价值观", reason: "信息不足，无法准确评估" },
          },
          summary: "初步匹配完成，建议进一步沟通了解",
          recommendation: "两位用户有一定的共同特质，值得进一步交流",
        };
      }
    }

    // 6. 更新 Match 记录
    await prisma.match.update({
      where: { id: matchId },
      data: {
        score: report.totalScore,
        report: JSON.stringify(report),
        chatLog: JSON.stringify(chatLog),
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Matching failed:", error);
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "failed",
        report: JSON.stringify({ error: String(error) }),
      },
    });
  }
}
